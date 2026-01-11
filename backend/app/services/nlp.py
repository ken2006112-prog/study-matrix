from sklearn.feature_extraction.text import TfidfVectorizer
from typing import List, Dict

class NLPService:
    def extract_concepts(self, texts: List[str], top_n: int = 20) -> List[Dict[str, float]]:
        """
        Extracts top concepts (keywords) from a list of texts using TF-IDF.
        Returns a list of dicts: {'text': 'concept', 'value': weight}
        """
        if not texts or all(not t.strip() for t in texts):
            return []

        # Simple stop words + custom educational stop words could be added here
        vectorizer = TfidfVectorizer(stop_words='english', max_features=top_n)
        
        try:
            tfidf_matrix = vectorizer.fit_transform(texts)
            feature_names = vectorizer.get_feature_names_out()
            
            # Sum tfidf frequency of each term across documents
            dense = tfidf_matrix.todense()
            denselist = dense.tolist()
            
            # Create a dictionary of term: value
            # In a real app, we might want to normalize this or use raw counts depending on visualization
            import numpy as np
            sums = np.sum(dense, axis=0)
            data = []
            for col, term in enumerate(feature_names):
                data.append({"text": term, "value": float(sums[0, col]) * 100}) # Scale up for visual weight
            
            # Sort by value
            data.sort(key=lambda x: x['value'], reverse=True)
            return data

        except ValueError:
            # Handle case with empty vocabulary or only stop words
            return []

nlp_service = NLPService()
