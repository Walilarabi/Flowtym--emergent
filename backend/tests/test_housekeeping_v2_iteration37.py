"""
Test Housekeeping V2 NestJS API - Iteration 37
Tests for FLOWTYM Housekeeping module with NestJS V2 API integration

Features tested:
- GET /api/v2/hotels/{hotelId}/housekeeping/stats - Statistics endpoint
- GET /api/v2/hotels/{hotelId}/housekeeping/tasks - Tasks list
- POST /api/v2/hotels/{hotelId}/housekeeping/tasks/{taskId}/start - Start task
- POST /api/v2/hotels/{hotelId}/housekeeping/tasks/{taskId}/complete - Complete task
- GET /api/config/hotels/{hotelId}/rooms/import/template - Excel template download
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://reception-suite-1.preview.emergentagent.com')
HOTEL_ID = "4f02769a-5f63-4121-bb97-a7061563d934"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "admin@flowtym.com", "password": "admin123"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture
def headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestHousekeepingV2Stats:
    """Test housekeeping statistics endpoint"""
    
    def test_get_stats_returns_200(self, headers):
        """GET /api/v2/hotels/{hotelId}/housekeeping/stats returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/housekeeping/stats",
            headers=headers
        )
        assert response.status_code == 200
        print(f"Stats response: {response.json()}")
    
    def test_stats_contains_rooms_data(self, headers):
        """Stats response contains rooms statistics"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/housekeeping/stats",
            headers=headers
        )
        data = response.json()
        
        assert "rooms" in data
        rooms = data["rooms"]
        assert "total" in rooms
        assert rooms["total"] >= 0
        print(f"Total rooms: {rooms['total']}")
    
    def test_stats_contains_tasks_data(self, headers):
        """Stats response contains tasks statistics"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/housekeeping/stats",
            headers=headers
        )
        data = response.json()
        
        assert "tasks" in data
        tasks = data["tasks"]
        assert "total" in tasks
        assert "a_faire" in tasks
        assert "en_cours" in tasks
        assert "termine" in tasks
        print(f"Tasks: total={tasks['total']}, a_faire={tasks['a_faire']}, en_cours={tasks['en_cours']}")
    
    def test_stats_contains_occupancy_rate(self, headers):
        """Stats response contains occupancy rate"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/housekeeping/stats",
            headers=headers
        )
        data = response.json()
        
        assert "occupancy_rate" in data
        assert isinstance(data["occupancy_rate"], (int, float))
        assert 0 <= data["occupancy_rate"] <= 100
        print(f"Occupancy rate: {data['occupancy_rate']}%")


class TestHousekeepingV2Tasks:
    """Test housekeeping tasks endpoints"""
    
    def test_get_tasks_returns_200(self, headers):
        """GET /api/v2/hotels/{hotelId}/housekeeping/tasks returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/housekeeping/tasks",
            headers=headers
        )
        assert response.status_code == 200
        tasks = response.json()
        assert isinstance(tasks, list)
        print(f"Found {len(tasks)} tasks")
    
    def test_tasks_have_required_fields(self, headers):
        """Tasks have required fields"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/housekeeping/tasks",
            headers=headers
        )
        tasks = response.json()
        
        if len(tasks) > 0:
            task = tasks[0]
            required_fields = ["_id", "hotel_id", "room_number", "task_type", "status"]
            for field in required_fields:
                assert field in task, f"Missing field: {field}"
            print(f"Task fields verified: {list(task.keys())}")
    
    def test_start_task(self, headers):
        """POST /api/v2/hotels/{hotelId}/housekeeping/tasks/{taskId}/start works"""
        # Get a task that is "a_faire"
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/housekeeping/tasks",
            headers=headers
        )
        tasks = response.json()
        a_faire_tasks = [t for t in tasks if t.get("status") == "a_faire"]
        
        if len(a_faire_tasks) == 0:
            pytest.skip("No tasks with status 'a_faire' available")
        
        task_id = a_faire_tasks[0]["_id"]
        
        # Start the task
        response = requests.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/housekeeping/tasks/{task_id}/start",
            headers=headers
        )
        assert response.status_code == 200 or response.status_code == 201
        
        data = response.json()
        assert data.get("status") == "en_cours"
        assert "started_at" in data
        print(f"Task {task_id} started successfully")
    
    def test_complete_task(self, headers):
        """POST /api/v2/hotels/{hotelId}/housekeeping/tasks/{taskId}/complete works"""
        # Get a task that is "en_cours"
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/housekeeping/tasks",
            headers=headers
        )
        tasks = response.json()
        en_cours_tasks = [t for t in tasks if t.get("status") == "en_cours"]
        
        if len(en_cours_tasks) == 0:
            pytest.skip("No tasks with status 'en_cours' available")
        
        task_id = en_cours_tasks[0]["_id"]
        
        # Complete the task
        response = requests.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/housekeeping/tasks/{task_id}/complete",
            headers=headers,
            json={"photos_after": [], "notes": "Test completion from pytest"}
        )
        assert response.status_code == 200 or response.status_code == 201
        
        data = response.json()
        assert data.get("status") == "termine"
        assert "completed_at" in data
        print(f"Task {task_id} completed successfully")


class TestHousekeepingV2Rooms:
    """Test rooms endpoints"""
    
    def test_get_rooms_returns_200(self, headers):
        """GET /api/v2/hotels/{hotelId}/rooms returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/rooms",
            headers=headers
        )
        assert response.status_code == 200
        rooms = response.json()
        assert isinstance(rooms, list)
        print(f"Found {len(rooms)} rooms")
    
    def test_rooms_have_required_fields(self, headers):
        """Rooms have required fields"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/rooms",
            headers=headers
        )
        rooms = response.json()
        
        if len(rooms) > 0:
            room = rooms[0]
            required_fields = ["_id", "hotel_id", "room_number", "room_type", "floor", "status"]
            for field in required_fields:
                assert field in room, f"Missing field: {field}"
            print(f"Room fields verified: {list(room.keys())}")
    
    def test_filter_rooms_by_floor(self, headers):
        """GET /api/v2/hotels/{hotelId}/rooms?floor=1 filters correctly"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/rooms?floor=1",
            headers=headers
        )
        assert response.status_code == 200
        rooms = response.json()
        
        for room in rooms:
            assert room.get("floor") == 1
        print(f"Found {len(rooms)} rooms on floor 1")


class TestHousekeepingV2Staff:
    """Test staff endpoints"""
    
    def test_get_staff_returns_200(self, headers):
        """GET /api/v2/hotels/{hotelId}/staff returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/staff",
            headers=headers
        )
        assert response.status_code == 200
        staff = response.json()
        assert isinstance(staff, list)
        print(f"Found {len(staff)} staff members")
    
    def test_filter_staff_by_role(self, headers):
        """GET /api/v2/hotels/{hotelId}/staff?role=femme_de_chambre filters correctly"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/staff?role=femme_de_chambre",
            headers=headers
        )
        assert response.status_code == 200
        staff = response.json()
        
        for member in staff:
            assert member.get("role") == "femme_de_chambre"
        print(f"Found {len(staff)} housekeepers")


class TestExcelImport:
    """Test Excel import template endpoint"""
    
    def test_download_template_returns_200(self, headers):
        """GET /api/config/hotels/{hotelId}/rooms/import/template returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/config/hotels/{HOTEL_ID}/rooms/import/template",
            headers=headers
        )
        assert response.status_code == 200
        print("Excel template download successful")
    
    def test_template_has_correct_content_type(self, headers):
        """Template has correct Excel content type"""
        response = requests.get(
            f"{BASE_URL}/api/config/hotels/{HOTEL_ID}/rooms/import/template",
            headers=headers
        )
        content_type = response.headers.get("content-type", "")
        assert "spreadsheetml" in content_type or "excel" in content_type.lower()
        print(f"Content-Type: {content_type}")
    
    def test_template_has_content_disposition(self, headers):
        """Template has content-disposition header for download"""
        response = requests.get(
            f"{BASE_URL}/api/config/hotels/{HOTEL_ID}/rooms/import/template",
            headers=headers
        )
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition
        assert "filename" in content_disposition
        print(f"Content-Disposition: {content_disposition}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
