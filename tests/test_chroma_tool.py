import unittest
from unittest.mock import MagicMock, patch

from orchestrator.tools.chroma_tool import chroma_tool


class ChromaToolTests(unittest.TestCase):
    @patch("orchestrator.tools.chroma_tool.retrieve_meeting_chunks", return_value=[])
    def test_returns_unknown_when_no_chunks_match(self, _mock_retrieve):
        result = chroma_tool({"query": "What was discussed about bonuses?"})

        self.assertEqual(result, {"response": "I don't know."})

    @patch("orchestrator.tools.chroma_tool.retrieve_meeting_chunks")
    @patch("orchestrator.tools.chroma_tool.get_llm")
    def test_sends_retrieved_context_to_llm(self, mock_get_llm, mock_retrieve):
        mock_retrieve.return_value = [
            {
                "document": "A new joiner starts on Monday.",
                "source": "meeting_6.txt",
                "chunk_id": 0,
                "distance": 0.12,
            },
            {
                "document": "Laptop setup will be handled by IT.",
                "source": "meeting_6.txt",
                "chunk_id": 1,
                "distance": 0.18,
            },
        ]
        mock_llm = MagicMock()
        mock_llm.invoke.return_value.content = "The new joiner starts on Monday and IT will handle laptop setup."
        mock_get_llm.return_value = mock_llm

        result = chroma_tool({"query": "What was decided for the new joiner?"})

        self.assertEqual(
            result["response"],
            "The new joiner starts on Monday and IT will handle laptop setup.",
        )
        prompt = mock_llm.invoke.call_args.args[0]
        self.assertIn("meeting_6.txt", prompt)
        self.assertIn("A new joiner starts on Monday.", prompt)
        self.assertIn("Laptop setup will be handled by IT.", prompt)


if __name__ == "__main__":
    unittest.main()
