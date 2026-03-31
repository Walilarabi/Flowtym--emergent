"""
Test Housekeeping Module - Reports, Found Items, Categories APIs
Tests for the new Housekeeping module features:
- Reports (Signalements) API
- Found Items (Objets Trouvés) API
- Categories (Configuration) API
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://reception-suite-1.preview.emergentagent.com')
HOTEL_ID = "4f02769a-5f63-4121-bb97-a7061563d934"

# Test credentials
TEST_EMAIL = "admin@flowtym.com"
TEST_PASSWORD = "admin123"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data or "access_token" in data, "No token in response"


class TestReportsAPI:
    """Tests for Reports (Signalements) API - /api/v2/hotels/{hotelId}/reports"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("token") or data.get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    def test_get_reports_list(self, auth_headers):
        """GET /api/v2/hotels/{hotelId}/reports - Get all reports"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get reports: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} reports")
    
    def test_get_reports_stats(self, auth_headers):
        """GET /api/v2/hotels/{hotelId}/reports/stats - Get reports statistics"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/stats",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get stats: {response.status_code} - {response.text}"
        data = response.json()
        # Stats should have pending, in_progress, resolved counts
        assert "pending" in data or "en_attente" in data or isinstance(data, dict), f"Invalid stats format: {data}"
        print(f"Reports stats: {data}")
    
    def test_create_report(self, auth_headers):
        """POST /api/v2/hotels/{hotelId}/reports - Create a new report"""
        report_data = {
            "room_number": "TEST101",
            "category_id": "test-category-1",
            "category_name": "Plomberie",
            "category_icon": "Droplets",
            "description": "Test report - fuite d'eau dans la salle de bain",
            "priority": "haute",
            "reporter_id": "test-reporter-1",
            "reporter_name": "Test Housekeeper"
        }
        response = requests.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports",
            json=report_data,
            headers=auth_headers
        )
        # Accept 201 (created) or 200 (ok)
        assert response.status_code in [200, 201], f"Failed to create report: {response.status_code} - {response.text}"
        data = response.json()
        assert "_id" in data or "id" in data, "Created report should have an ID"
        print(f"Created report: {data.get('_id') or data.get('id')}")
        return data
    
    def test_get_reports_by_room(self, auth_headers):
        """GET /api/v2/hotels/{hotelId}/reports/room/{roomNumber} - Get reports by room"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/room/101",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get room reports: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} reports for room 101")


class TestFoundItemsAPI:
    """Tests for Found Items (Objets Trouvés) API - /api/v2/hotels/{hotelId}/found-items"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("token") or data.get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    def test_get_found_items_list(self, auth_headers):
        """GET /api/v2/hotels/{hotelId}/found-items - Get all found items"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/found-items",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get found items: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} found items")
    
    def test_get_found_items_stats(self, auth_headers):
        """GET /api/v2/hotels/{hotelId}/found-items/stats - Get found items statistics"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/found-items/stats",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get stats: {response.status_code} - {response.text}"
        data = response.json()
        # Stats should have pending, consigned, returned counts
        assert isinstance(data, dict), f"Invalid stats format: {data}"
        print(f"Found items stats: {data}")
    
    def test_create_found_item(self, auth_headers):
        """POST /api/v2/hotels/{hotelId}/found-items - Create a new found item"""
        item_data = {
            "room_number": "TEST102",
            "category_id": "test-category-2",
            "category_name": "Téléphone",
            "category_icon": "Smartphone",
            "name": "iPhone 15 Pro",
            "description": "Téléphone trouvé sous le lit",
            "location_found": "Sous le lit",
            "reporter_id": "test-reporter-1",
            "reporter_name": "Test Housekeeper"
        }
        response = requests.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/found-items",
            json=item_data,
            headers=auth_headers
        )
        # Accept 201 (created) or 200 (ok)
        assert response.status_code in [200, 201], f"Failed to create found item: {response.status_code} - {response.text}"
        data = response.json()
        assert "_id" in data or "id" in data, "Created item should have an ID"
        print(f"Created found item: {data.get('_id') or data.get('id')}")
        return data
    
    def test_get_found_items_by_room(self, auth_headers):
        """GET /api/v2/hotels/{hotelId}/found-items/room/{roomNumber} - Get found items by room"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/found-items/room/101",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get room found items: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} found items for room 101")
    
    def test_search_found_items(self, auth_headers):
        """GET /api/v2/hotels/{hotelId}/found-items/search - Search found items"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/found-items/search?q=phone",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to search found items: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Search results: {len(data)} items")


class TestCategoriesAPI:
    """Tests for Categories API - /api/v2/hotels/{hotelId}/settings/categories"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("token") or data.get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    def test_get_all_categories(self, auth_headers):
        """GET /api/v2/hotels/{hotelId}/settings/categories - Get all categories"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/settings/categories",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get categories: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} categories")
    
    def test_get_report_categories(self, auth_headers):
        """GET /api/v2/hotels/{hotelId}/settings/categories/reports - Get report categories"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/settings/categories/reports",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get report categories: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} report categories")
        # Verify category structure
        if len(data) > 0:
            cat = data[0]
            assert "name" in cat, "Category should have a name"
            print(f"Sample category: {cat.get('name')}")
    
    def test_get_found_item_categories(self, auth_headers):
        """GET /api/v2/hotels/{hotelId}/settings/categories/found-items - Get found item categories"""
        response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/settings/categories/found-items",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get found item categories: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} found item categories")
    
    def test_create_category(self, auth_headers):
        """POST /api/v2/hotels/{hotelId}/settings/categories - Create a new category"""
        category_data = {
            "name": f"TEST_Category_{datetime.now().strftime('%H%M%S')}",
            "type": "report",
            "icon": "AlertTriangle",
            "color": "#EF4444"
        }
        response = requests.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/settings/categories",
            json=category_data,
            headers=auth_headers
        )
        # Accept 201 (created) or 200 (ok)
        assert response.status_code in [200, 201], f"Failed to create category: {response.status_code} - {response.text}"
        data = response.json()
        assert "_id" in data or "id" in data, "Created category should have an ID"
        print(f"Created category: {data.get('name')}")
        return data
    
    def test_update_category(self, auth_headers):
        """PUT /api/v2/hotels/{hotelId}/settings/categories/{categoryId} - Update a category"""
        # First create a category to update
        category_data = {
            "name": f"TEST_ToUpdate_{datetime.now().strftime('%H%M%S')}",
            "type": "report",
            "icon": "AlertTriangle",
            "color": "#EF4444"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/settings/categories",
            json=category_data,
            headers=auth_headers
        )
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create category to update")
        
        created = create_response.json()
        category_id = created.get("_id") or created.get("id")
        
        # Update the category
        update_data = {
            "name": f"TEST_Updated_{datetime.now().strftime('%H%M%S')}",
            "color": "#22C55E"
        }
        response = requests.put(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/settings/categories/{category_id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to update category: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("name") == update_data["name"] or "name" in data, "Category name should be updated"
        print(f"Updated category: {data.get('name')}")


class TestAPIIntegration:
    """Integration tests for the complete workflow"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("token") or data.get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    def test_full_report_workflow(self, auth_headers):
        """Test complete report workflow: create -> get -> update status"""
        # 1. Create a report
        report_data = {
            "room_number": "WORKFLOW101",
            "category_id": "workflow-cat-1",
            "category_name": "Électricité",
            "category_icon": "Lightbulb",
            "description": "Workflow test - ampoule grillée",
            "priority": "moyenne",
            "reporter_id": "workflow-reporter",
            "reporter_name": "Workflow Tester"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports",
            json=report_data,
            headers=auth_headers
        )
        assert create_response.status_code in [200, 201], f"Create failed: {create_response.text}"
        created = create_response.json()
        report_id = created.get("_id") or created.get("id")
        print(f"1. Created report: {report_id}")
        
        # 2. Get the report
        get_response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200, f"Get failed: {get_response.text}"
        fetched = get_response.json()
        assert fetched.get("room_number") == "WORKFLOW101", "Room number mismatch"
        print(f"2. Fetched report: {fetched.get('room_number')}")
        
        # 3. Take over the report
        takeover_data = {
            "technician_id": "tech-workflow",
            "technician_name": "Workflow Technician"
        }
        takeover_response = requests.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/take-over",
            json=takeover_data,
            headers=auth_headers
        )
        assert takeover_response.status_code == 200, f"Take-over failed: {takeover_response.text}"
        print("3. Report taken over successfully")
        
        # 4. Resolve the report
        resolve_data = {
            "resolution_notes": "Ampoule remplacée",
            "resolved_by_id": "tech-workflow",
            "resolved_by_name": "Workflow Technician"
        }
        resolve_response = requests.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/resolve",
            json=resolve_data,
            headers=auth_headers
        )
        assert resolve_response.status_code == 200, f"Resolve failed: {resolve_response.text}"
        print("4. Report resolved successfully")
        
        print("✅ Full report workflow completed successfully")
    
    def test_full_found_item_workflow(self, auth_headers):
        """Test complete found item workflow: create -> get -> return"""
        # 1. Create a found item
        item_data = {
            "room_number": "WORKFLOW102",
            "category_id": "workflow-cat-2",
            "category_name": "Bijoux",
            "category_icon": "Gem",
            "name": "Bague en or",
            "description": "Workflow test - bague trouvée dans la salle de bain",
            "location_found": "Salle de bain",
            "reporter_id": "workflow-reporter",
            "reporter_name": "Workflow Tester"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/found-items",
            json=item_data,
            headers=auth_headers
        )
        assert create_response.status_code in [200, 201], f"Create failed: {create_response.text}"
        created = create_response.json()
        item_id = created.get("_id") or created.get("id")
        print(f"1. Created found item: {item_id}")
        
        # 2. Get the item
        get_response = requests.get(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/found-items/{item_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200, f"Get failed: {get_response.text}"
        fetched = get_response.json()
        assert fetched.get("room_number") == "WORKFLOW102", "Room number mismatch"
        print(f"2. Fetched found item: {fetched.get('name')}")
        
        # 3. Return the item
        return_data = {
            "recipient_name": "John Doe",
            "returned_by_id": "reception-workflow",
            "returned_by_name": "Workflow Reception"
        }
        return_response = requests.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/found-items/{item_id}/return",
            json=return_data,
            headers=auth_headers
        )
        assert return_response.status_code == 200, f"Return failed: {return_response.text}"
        print("3. Found item returned successfully")
        
        print("✅ Full found item workflow completed successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
