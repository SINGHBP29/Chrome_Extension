import unittest

from orchestrator.utils.postgres_queries import build_employee_query


class EmployeeQueryBuilderTests(unittest.TestCase):
    def test_builds_count_query_for_location_and_type(self):
        sql, params = build_employee_query("How many interns are in Bangalore?")

        self.assertIn("COUNT(*)", sql)
        self.assertIn("type = %s", sql)
        self.assertIn("location = %s", sql)
        self.assertEqual(params, ("Intern", "Bangalore"))

    def test_builds_filtered_listing_query(self):
        sql, params = build_employee_query(
            "Show Python Full Stack employees working with Pepsi in Bangalore"
        )

        self.assertIn("SELECT employee_id, name, email, department", sql)
        self.assertIn("department = %s", sql)
        self.assertIn("client = %s", sql)
        self.assertIn("location = %s", sql)
        self.assertIn("LIMIT 10", sql)
        self.assertEqual(
            params,
            ("Python Full Stack", "Bangalore", "Pepsi"),
        )


if __name__ == "__main__":
    unittest.main()
