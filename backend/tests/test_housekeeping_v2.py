"""
Test suite for FLOWTYM Housekeeping V2 NestJS API
Tests the /api/v2/* endpoints proxied through FastAPI
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://reception-suite-1.preview.emergentagent.com')
TEST_HOTEL_ID = "69c26ab888a82645fcca6d69"

# ==================== FIXTURES ====================

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@flowtym.com",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")

@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


# ==================== AUTH TESTS ====================

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self, api_client):
        """Test login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@flowtym.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == "admin@flowtym.com"
        print(f"✓ Login successful for admin@flowtym.com")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")


# ==================== HOUSEKEEPING V2 STATS ====================

class TestHousekeepingStats:
    """Test GET /api/v2/hotels/{hotelId}/housekeeping/stats"""
    
    def test_get_stats_success(self, api_client):
        """Test getting housekeeping stats"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{TEST_HOTEL_ID}/housekeeping/stats")
        assert response.status_code == 200, f"Stats request failed: {response.text}"
        
        data = response.json()
        # Validate response structure
        assert "rooms" in data, "rooms not in stats"
        assert "tasks" in data, "tasks not in stats"
        assert "inspections" in data, "inspections not in stats"
        assert "occupancy_rate" in data, "occupancy_rate not in stats"
        assert "cleanliness_rate" in data, "cleanliness_rate not in stats"
        
        # Validate rooms stats
        rooms = data["rooms"]
        assert "total" in rooms, "total not in rooms stats"
        assert rooms["total"] > 0, "No rooms found"
        
        # Validate tasks stats
        tasks = data["tasks"]
        assert "total" in tasks, "total not in tasks stats"
        
        print(f"✓ Stats retrieved: {rooms['total']} rooms, {tasks['total']} tasks, {data['occupancy_rate']}% occupancy")


# ==================== HOUSEKEEPING V2 ROOMS ====================

class TestHousekeepingRooms:
    """Test GET /api/v2/hotels/{hotelId}/rooms"""
    
    def test_get_rooms_success(self, api_client):
        """Test getting all rooms"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{TEST_HOTEL_ID}/rooms")
        assert response.status_code == 200, f"Rooms request failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "No rooms returned"
        
        # Validate room structure
        room = data[0]
        assert "room_number" in room, "room_number not in room"
        assert "room_type" in room, "room_type not in room"
        assert "status" in room, "status not in room"
        assert "cleaning_status" in room, "cleaning_status not in room"
        assert "floor" in room, "floor not in room"
        
        print(f"✓ Retrieved {len(data)} rooms")
        
        # Check room statuses distribution
        statuses = {}
        for r in data:
            s = r.get("status", "unknown")
            statuses[s] = statuses.get(s, 0) + 1
        print(f"  Room statuses: {statuses}")
    
    def test_get_rooms_by_floor(self, api_client):
        """Test filtering rooms by floor"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{TEST_HOTEL_ID}/rooms?floor=1")
        assert response.status_code == 200, f"Rooms by floor request failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # All rooms should be on floor 1
        for room in data:
            assert room.get("floor") == 1, f"Room {room.get('room_number')} not on floor 1"
        
        print(f"✓ Retrieved {len(data)} rooms on floor 1")


# ==================== HOUSEKEEPING V2 STAFF ====================

class TestHousekeepingStaff:
    """Test GET /api/v2/hotels/{hotelId}/staff"""
    
    def test_get_staff_success(self, api_client):
        """Test getting all staff"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{TEST_HOTEL_ID}/staff")
        assert response.status_code == 200, f"Staff request failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "No staff returned"
        
        # Validate staff structure
        staff = data[0]
        assert "first_name" in staff, "first_name not in staff"
        assert "last_name" in staff, "last_name not in staff"
        assert "role" in staff, "role not in staff"
        
        print(f"✓ Retrieved {len(data)} staff members")
        
        # Check roles distribution
        roles = {}
        for s in data:
            r = s.get("role", "unknown")
            roles[r] = roles.get(r, 0) + 1
        print(f"  Staff roles: {roles}")
    
    def test_get_femmes_de_chambre(self, api_client):
        """Test getting housekeepers only"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{TEST_HOTEL_ID}/staff?role=femme_de_chambre")
        assert response.status_code == 200, f"Housekeepers request failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # All should be femme_de_chambre
        for staff in data:
            assert staff.get("role") == "femme_de_chambre", f"Staff {staff.get('first_name')} is not femme_de_chambre"
        
        print(f"✓ Retrieved {len(data)} housekeepers (femmes de chambre)")


# ==================== HOUSEKEEPING V2 TASKS ====================

class TestHousekeepingTasks:
    """Test GET /api/v2/hotels/{hotelId}/housekeeping/tasks"""
    
    def test_get_tasks_success(self, api_client):
        """Test getting all tasks"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{TEST_HOTEL_ID}/housekeeping/tasks")
        assert response.status_code == 200, f"Tasks request failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "No tasks returned"
        
        # Validate task structure
        task = data[0]
        assert "room_number" in task, "room_number not in task"
        assert "task_type" in task, "task_type not in task"
        assert "status" in task, "status not in task"
        assert "assigned_to_name" in task or "assigned_to" in task, "assignment info not in task"
        
        print(f"✓ Retrieved {len(data)} tasks")
        
        # Check task types distribution
        types = {}
        statuses = {}
        for t in data:
            tt = t.get("task_type", "unknown")
            ts = t.get("status", "unknown")
            types[tt] = types.get(tt, 0) + 1
            statuses[ts] = statuses.get(ts, 0) + 1
        print(f"  Task types: {types}")
        print(f"  Task statuses: {statuses}")


# ==================== HOUSEKEEPING V2 SEED ====================

class TestHousekeepingSeed:
    """Test POST /api/v2/hotels/{hotelId}/housekeeping/seed"""
    
    def test_seed_data_endpoint_exists(self, authenticated_client):
        """Test that seed endpoint exists and responds"""
        # Note: We don't actually seed to avoid duplicating data
        # Just verify the endpoint is accessible
        response = authenticated_client.post(
            f"{BASE_URL}/api/v2/hotels/{TEST_HOTEL_ID}/housekeeping/seed",
            json={}
        )
        # Should return 200 or 201 (success) or 400/409 (already seeded)
        assert response.status_code in [200, 201, 400, 409], f"Seed endpoint error: {response.status_code} - {response.text}"
        print(f"✓ Seed endpoint accessible (status: {response.status_code})")


# ==================== PROXY VERIFICATION ====================

class TestProxyConfiguration:
    """Verify FastAPI proxy to NestJS is working"""
    
    def test_proxy_stats_endpoint(self, api_client):
        """Verify /api/v2 proxy works for stats"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{TEST_HOTEL_ID}/housekeeping/stats")
        assert response.status_code == 200, f"Proxy failed: {response.text}"
        assert "rooms" in response.json(), "Invalid response from NestJS"
        print("✓ Proxy to NestJS working for stats endpoint")
    
    def test_proxy_rooms_endpoint(self, api_client):
        """Verify /api/v2 proxy works for rooms"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{TEST_HOTEL_ID}/rooms")
        assert response.status_code == 200, f"Proxy failed: {response.text}"
        assert isinstance(response.json(), list), "Invalid response from NestJS"
        print("✓ Proxy to NestJS working for rooms endpoint")
    
    def test_proxy_staff_endpoint(self, api_client):
        """Verify /api/v2 proxy works for staff"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{TEST_HOTEL_ID}/staff")
        assert response.status_code == 200, f"Proxy failed: {response.text}"
        assert isinstance(response.json(), list), "Invalid response from NestJS"
        print("✓ Proxy to NestJS working for staff endpoint")
    
    def test_proxy_tasks_endpoint(self, api_client):
        """Verify /api/v2 proxy works for tasks"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{TEST_HOTEL_ID}/housekeeping/tasks")
        assert response.status_code == 200, f"Proxy failed: {response.text}"
        assert isinstance(response.json(), list), "Invalid response from NestJS"
        print("✓ Proxy to NestJS working for tasks endpoint")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
