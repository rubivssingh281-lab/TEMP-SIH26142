import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_job_flow():
    with client:
        print("1. Testing POST /api/v1/jobs (Upload)")
        response = client.post(
            "/api/v1/jobs",
            files={"file": ("test_image.tif", b"dummy_content", "image/tiff")}
        )
        assert response.status_code == 201, response.text
        job_id = response.json()["job_id"]
        print(f"   Created Job ID: {job_id}")

        print("2. Testing GET /api/v1/jobs/{id} (Check state)")
        response = client.get(f"/api/v1/jobs/{job_id}")
        assert response.status_code == 200, response.text
        assert response.json()["status"] == "created"
        print(f"   Status: {response.json()['status']}")

        print("3. Testing PATCH /api/v1/jobs/{id}/config (Set config)")
        response = client.patch(
            f"/api/v1/jobs/{job_id}/config",
            json={
                "model": "gan",
                "target_resolution_m": 2.5,
                "bands": ["B2", "B3", "B4"],
                "aoi_coordinates": [[77.1, 34.2], [77.2, 34.3]]
            }
        )
        assert response.status_code == 200, response.text
        print("   Config patched successfully.")

        print("4. Testing POST /api/v1/jobs/{id}/run (Enqueue job)")
        response = client.post(f"/api/v1/jobs/{job_id}/run")
        assert response.status_code == 202, response.text
        print("   Job enqueued successfully.")

        print("5. Testing GET /api/v1/jobs/{id} (Check state again)")
        response = client.get(f"/api/v1/jobs/{job_id}")
        assert response.status_code == 200, response.text
        print(f"   New Status: {response.json()['status']}")
        
        import time
        print("6. Polling for completion...")
        for _ in range(15):
            time.sleep(1)
            response = client.get(f"/api/v1/jobs/{job_id}")
            data = response.json()
            print(f"   [{data['status']}] Stage: {data['stage']} - Progress: {data['progress']}%")
            if data["status"] in ["done", "failed"]:
                break
        
        assert data["status"] == "done", f"Job didn't complete. Final data: {data}"

        print("7. Testing GET /api/v1/jobs/{id}/results (Fetch metadata)")
        response = client.get(f"/api/v1/jobs/{job_id}/results")
        assert response.status_code == 200, response.text
        results_data = response.json()
        assert "bounds" in results_data
        assert "metrics_summary" in results_data
        print("   Results metadata fetched successfully.")
        
        print("8. Testing GET /api/v1/jobs/{id}/tiles/enhanced (Fetch PNG preview)")
        response = client.get(f"/api/v1/jobs/{job_id}/tiles/enhanced")
        assert response.status_code == 200, response.text
        assert response.headers["content-type"] == "image/png"
        print("   Enhanced tile fetched successfully.")
        
        print("9. Testing GET /api/v1/jobs/{id}/export (Fetch ZIP bundle)")
        response = client.get(f"/api/v1/jobs/{job_id}/export")
        assert response.status_code == 200, response.text
        assert "zip" in response.headers["content-type"]
        print("   ZIP export downloaded successfully.")
        
        print("10. Testing GET /api/v1/jobs/{id}/metrics")
        response = client.get(f"/api/v1/jobs/{job_id}/metrics")
        assert response.status_code == 200, response.text
        print("    Metrics fetched successfully.")
        
        print("11. Testing GET /api/v1/jobs/{id}/uncertainty")
        response = client.get(f"/api/v1/jobs/{job_id}/uncertainty")
        assert response.status_code == 200, response.text
        print("    Uncertainty fetched successfully.")
        
        print("12. Testing GET /api/v1/jobs/{id}/applications/agriculture")
        response = client.get(f"/api/v1/jobs/{job_id}/applications/agriculture")
        assert response.status_code == 200, response.text
        print("    Applications fetched successfully.")

if __name__ == "__main__":
    test_job_flow()
    print("All tests passed successfully!")
