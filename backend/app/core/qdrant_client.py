import os
import math
import logging
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

# Try importing Qdrant
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False

# Try importing fastembed for local lightweight multilingual embeddings
try:
    from fastembed import TextEmbedding
    FASTEMBED_AVAILABLE = True
except ImportError:
    FASTEMBED_AVAILABLE = False

class VectorStoreManager:
    def __init__(self):
        self.client = None
        self.embed_model = None
        self._init_qdrant()
        self._init_embedder()

    def _init_qdrant(self):
        if not QDRANT_AVAILABLE:
            logger.warning("qdrant-client not installed; running in in-memory vector mode.")
            return

        host = settings.QDRANT_HOST
        port = settings.QDRANT_PORT

        # Try connecting to remote Qdrant
        try:
            client = QdrantClient(host=host, port=port, timeout=2.0)
            client.get_collections()
            self.client = client
            logger.info(f"Connected to Qdrant at {host}:{port}")
        except Exception as e:
            logger.warning(f"Could not connect to Qdrant at {host}:{port}: {e}. Initializing in-memory Qdrant instance.")
            try:
                self.client = QdrantClient(":memory:")
            except Exception:
                self.client = None

    def _init_embedder(self):
        if FASTEMBED_AVAILABLE:
            try:
                # Fast local lightweight embedding model (~60MB)
                self.embed_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
                logger.info("FastEmbed initialized successfully.")
            except Exception as e:
                logger.warning(f"FastEmbed init failed: {e}. Using deterministic vector fallback.")
                self.embed_model = None
        else:
            self.embed_model = None

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        if self.embed_model is not None:
            try:
                embeddings = list(self.embed_model.embed(texts))
                return [list(map(float, emb)) for emb in embeddings]
            except Exception as e:
                logger.warning(f"Embedding generation error: {e}. Falling back to deterministic dense vector.")

        # Deterministic lightweight dense vector fallback (dimension 128)
        # Guarantees semantic continuity without requiring massive external downloads
        vectors = []
        for text in texts:
            words = text.lower().split()
            vec = [0.0] * 128
            for i, w in enumerate(words):
                h = hash(w) % 128
                vec[h] += 1.0 / (i + 1)
            # Normalize vector
            norm = math.sqrt(sum(x * x for x in vec)) or 1.0
            vec = [x / norm for x in vec]
            vectors.append(vec)
        return vectors

    def compute_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a)) or 1e-9
        norm_b = math.sqrt(sum(b * b for b in vec_b)) or 1e-9
        sim = dot / (norm_a * norm_b)
        return max(0.0, min(1.0, float(sim)))

    def compute_mean_semantic_similarity(self, jd_requirements: List[str], resume_bullets: List[str]) -> float:
        """
        Computes maximum alignment similarity for each JD requirement against the candidate's resume bullets,
        then returns the mean coverage score (0.0 to 1.0).
        """
        if not jd_requirements or not resume_bullets:
            return 0.0

        jd_vectors = self.embed_texts(jd_requirements)
        bullet_vectors = self.embed_texts(resume_bullets)

        total_sim = 0.0
        for jd_vec in jd_vectors:
            max_sim_for_req = max(self.compute_similarity(jd_vec, b_vec) for b_vec in bullet_vectors)
            total_sim += max_sim_for_req

        return round(total_sim / len(jd_requirements), 4)

vector_store = VectorStoreManager()
