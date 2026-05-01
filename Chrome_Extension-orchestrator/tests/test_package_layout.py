import os
import unittest
from unittest.mock import patch


class PackageImportTests(unittest.TestCase):
    def test_main_module_imports_as_package(self):
        import orchestrator.main  # noqa: F401

    def test_graph_module_imports_as_package(self):
        # The project previously had a `graph` module; today the entrypoints are `agent` and `api`.
        import orchestrator.agent  # noqa: F401
        import orchestrator.api  # noqa: F401


class DbConfigTests(unittest.TestCase):
    @patch("orchestrator.utils.db.psycopg2.connect")
    def test_connection_uses_env_host_port_and_credentials(self, mock_connect):
        env = {
            "DATABASE_URL": "",
            "DB_HOST": "db",
            "DB_PORT": "5432",
            "DB_NAME": "orchestrator_db",
            "DB_USER": "postgres",
            "DB_PASSWORD": "postgres",
            "DB_CONNECT_TIMEOUT": "5",
        }

        with patch.dict(os.environ, env, clear=False):
            from orchestrator.utils.db import get_connection

            get_connection()

        mock_connect.assert_called_once_with(
            host="db",
            port="5432",
            database="orchestrator_db",
            user="postgres",
            password="postgres",
            connect_timeout=5,
        )


if __name__ == "__main__":
    unittest.main()
