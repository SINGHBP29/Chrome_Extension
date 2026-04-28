import os
import unittest
from unittest.mock import patch


class PackageImportTests(unittest.TestCase):
    def test_main_module_imports_as_package(self):
        import orchestrator.main

        self.assertTrue(hasattr(orchestrator.main, "graph"))

    def test_graph_module_imports_as_package(self):
        import orchestrator.graph

        self.assertTrue(hasattr(orchestrator.graph, "graph"))


class DbConfigTests(unittest.TestCase):
    @patch("orchestrator.utils.db.psycopg2.connect")
    def test_connection_uses_env_host_port_and_credentials(self, mock_connect):
        env = {
            "DB_HOST": "db",
            "DB_PORT": "5432",
            "DB_NAME": "orchestrator_db",
            "DB_USER": "postgres",
            "DB_PASSWORD": "postgres",
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
        )


if __name__ == "__main__":
    unittest.main()
