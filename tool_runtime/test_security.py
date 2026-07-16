import pytest

from runner import normalize_requirements, package_name, validate_tool_name


@pytest.mark.parametrize("name", ["calc", "tool_123", "A" * 64])
def test_validate_tool_name_accepts_safe_names(name):
    assert validate_tool_name(name) == name


@pytest.mark.parametrize("name", ["../secret", "tool-name", "tool.name", "", "A" * 65])
def test_validate_tool_name_rejects_path_or_unsafe_names(name):
    with pytest.raises(ValueError):
        validate_tool_name(name)


def test_normalize_requirements_accepts_simple_pypi_specs():
    assert normalize_requirements(["requests==2.32.3", "httpx[http2]>=0.27"]) == [
        "requests==2.32.3",
        "httpx[http2]>=0.27",
    ]
    assert package_name("httpx[http2]>=0.27") == "httpx"


@pytest.mark.parametrize(
    "requirement",
    [
        "git+https://example.com/pkg.git",
        "./local-package",
        "requests --index-url https://evil.example/simple",
        "pkg; python_version > '3.12'",
    ],
)
def test_normalize_requirements_rejects_url_paths_flags_and_markers(requirement):
    with pytest.raises(ValueError):
        normalize_requirements([requirement])


def test_runtime_referer_origin_helper_accepts_allowed_origin():
    from server import _same_origin_from_referer

    assert _same_origin_from_referer(
        "http://127.0.0.1:8080/settings", {"http://127.0.0.1:8080"}
    )


def test_runtime_referer_origin_helper_rejects_untrusted_origin_prefix():
    from server import _same_origin_from_referer

    assert not _same_origin_from_referer(
        "http://127.0.0.1:8080.evil.example/settings", {"http://127.0.0.1:8080"}
    )
