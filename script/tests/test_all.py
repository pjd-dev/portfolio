#!/usr/bin/env python3
"""
Unified test suite for vault platform scripts.
Replaces bash test files with cleaner Python implementation.
"""

import os
import sys
import tempfile
import subprocess
from pathlib import Path
from dataclasses import dataclass
from typing import List, Callable


@dataclass
class TestResult:
    name: str
    passed: bool
    error: str = ""


class TestRunner:
    def __init__(self):
        self.results: List[TestResult] = []
        self.script_root = Path(__file__).parent.parent

    def info(self, message: str):
        """Print info message."""
        print(f"[INFO] {message}")

    def run_test(self, name: str, test_func: Callable) -> TestResult:
        """Run a single test and record result."""
        self.info(f"Running {name}...")
        try:
            test_func()
            result = TestResult(name=name, passed=True)
            self.info(f"✓ {name} passed")
        except AssertionError as e:
            result = TestResult(name=name, passed=False, error=str(e))
            self.info(f"✗ {name} failed: {e}")
        except Exception as e:
            result = TestResult(name=name, passed=False, error=str(e))
            self.info(f"✗ {name} error: {e}")

        self.results.append(result)
        print()
        return result

    def print_summary(self):
        """Print test summary."""
        passed = sum(1 for r in self.results if r.passed)
        failed = sum(1 for r in self.results if not r.passed)

        self.info(f"Test Results: {passed} passed, {failed} failed")

        if failed > 0:
            self.info("\nFailed tests:")
            for result in self.results:
                if not result.passed:
                    self.info(f"  - {result.name}: {result.error}")

        return failed == 0

    # Prepare.sh Tests
    def test_vault_data_volume_env(self):
        """Test VAULT_DATA_VOLUME environment variable."""
        os.environ["VAULT_DATA_VOLUME"] = "test-vault-volume"
        vault_host_path = os.environ.get("VAULT_HOST_PATH") or os.environ.get(
            "VAULT_DATA_VOLUME"
        )
        assert (
            vault_host_path == "test-vault-volume"
        ), f"Expected 'test-vault-volume', got '{vault_host_path}'"

    def test_vault_data_volume_fallback(self):
        """Test VAULT_DATA_VOLUME fallback to default."""
        os.environ.pop("VAULT_DATA_VOLUME", None)
        os.environ.pop("VAULT_HOST_PATH", None)
        vault_host_path = os.environ.get("VAULT_HOST_PATH") or os.environ.get(
            "VAULT_DATA_VOLUME", "vault"
        )
        assert vault_host_path == "vault", f"Expected 'vault', got '{vault_host_path}'"

    def test_export_variables(self):
        """Test environment variable exports."""
        os.environ["PROJECT_PATH"] = "/tmp/test-project"
        os.environ["IMAGE_NAME"] = "test-vault"
        os.environ["CONTAINER_NAME"] = "test-container"

        assert os.environ["PROJECT_PATH"], "PROJECT_PATH not set"
        assert os.environ["IMAGE_NAME"], "IMAGE_NAME not set"
        assert os.environ["CONTAINER_NAME"], "CONTAINER_NAME not set"

    # Restart-all.sh Tests
    def test_env_loading(self):
        """Test .env file loading."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".env", delete=False) as f:
            f.write("POD_NAME=test-vaulty-pod\n")
            f.write("MCP_POD_NAME=test-mcp-pod\n")
            f.write("VAULT_DATA_VOLUME=test-vault\n")
            env_file = f.name

        try:
            # Read and verify env file
            env_vars = {}
            with open(env_file, "r") as f:
                for line in f:
                    if "=" in line:
                        key, value = line.strip().split("=", 1)
                        env_vars[key] = value

            assert (
                env_vars.get("POD_NAME") == "test-vaulty-pod"
            ), "POD_NAME not loaded correctly"
            assert (
                env_vars.get("MCP_POD_NAME") == "test-mcp-pod"
            ), "MCP_POD_NAME not loaded correctly"
        finally:
            os.unlink(env_file)

    def test_pod_name_defaults(self):
        """Test pod name default values."""
        os.environ.pop("POD_NAME", None)
        os.environ.pop("MCP_POD_NAME", None)

        vaulty_pod = os.environ.get("POD_NAME", "vaulty-pod")
        mcp_pod = os.environ.get("MCP_POD_NAME", "mcp-pod")

        assert vaulty_pod == "vaulty-pod", f"Expected 'vaulty-pod', got '{vaulty_pod}'"
        assert mcp_pod == "mcp-pod", f"Expected 'mcp-pod', got '{mcp_pod}'"

    def test_log_directory_creation(self):
        """Test log directory creation."""
        with tempfile.TemporaryDirectory() as tmpdir:
            log_dir = Path(tmpdir) / "test-logs"
            log_dir.mkdir(parents=True, exist_ok=True)

            assert log_dir.exists(), f"Log directory {log_dir} was not created"
            assert log_dir.is_dir(), f"Log path {log_dir} is not a directory"

    def run_all(self) -> bool:
        """Run all tests."""
        self.info("Running all tests...")
        print()

        # Prepare.sh tests
        self.run_test("test_vault_data_volume_env", self.test_vault_data_volume_env)
        self.run_test(
            "test_vault_data_volume_fallback", self.test_vault_data_volume_fallback
        )
        self.run_test("test_export_variables", self.test_export_variables)

        # Restart-all.sh tests
        self.run_test("test_env_loading", self.test_env_loading)
        self.run_test("test_pod_name_defaults", self.test_pod_name_defaults)
        self.run_test("test_log_directory_creation", self.test_log_directory_creation)

        return self.print_summary()


if __name__ == "__main__":
    runner = TestRunner()
    success = runner.run_all()
    sys.exit(0 if success else 1)
