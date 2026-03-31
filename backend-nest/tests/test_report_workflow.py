"""
Test Report Workflow APIs - Phase 3 Direction FLOWTYM
Tests for: take-over, comment, invoice, resolve endpoints
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://reception-suite-1.preview.emergentagent.com')
HOTEL_ID = "4f02769a-5f63-4121-bb97-a7061563d934"

# Test credentials
TEST_EMAIL = "admin@flowtym.com"
TEST_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Shared requests session with auth"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestReportWorkflowAPIs:
    """Test the complete report workflow: create -> take-over -> comment -> invoice -> resolve"""
    
    created_report_id = None
    
    def test_01_get_reports_list(self, api_client):
        """GET /api/v2/hotels/:hotelId/reports - List all reports"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports")
        assert response.status_code == 200, f"Failed to get reports: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Found {len(data)} reports")
    
    def test_02_get_reports_stats(self, api_client):
        """GET /api/v2/hotels/:hotelId/reports/stats - Get statistics"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/stats")
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        
        data = response.json()
        assert "pending" in data, "Stats should have 'pending' field"
        assert "in_progress" in data, "Stats should have 'in_progress' field"
        assert "resolved" in data, "Stats should have 'resolved' field"
        print(f"✓ Stats: pending={data['pending']}, in_progress={data['in_progress']}, resolved={data['resolved']}")
    
    def test_03_create_report(self, api_client):
        """POST /api/v2/hotels/:hotelId/reports - Create a new report"""
        payload = {
            "room_number": "TEST_301",
            "category_name": "TEST_Fuite d'eau",
            "category_icon": "Droplets",
            "description": "TEST - Fuite sous le lavabo de la salle de bain",
            "reporter_id": "test-reporter-1",
            "reporter_name": "TEST Reporter",
            "priority": "haute"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports",
            json=payload
        )
        assert response.status_code in [200, 201], f"Failed to create report: {response.text}"
        
        data = response.json()
        assert data.get("room_number") == "TEST_301", "Room number mismatch"
        assert data.get("status") == "en_attente", "New report should have 'en_attente' status"
        assert data.get("category_name") == "TEST_Fuite d'eau", "Category name mismatch"
        
        TestReportWorkflowAPIs.created_report_id = data.get("_id")
        print(f"✓ Created report with ID: {TestReportWorkflowAPIs.created_report_id}")
    
    def test_04_get_report_by_id(self, api_client):
        """GET /api/v2/hotels/:hotelId/reports/:reportId - Get single report"""
        report_id = TestReportWorkflowAPIs.created_report_id
        assert report_id, "No report ID from previous test"
        
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}")
        assert response.status_code == 200, f"Failed to get report: {response.text}"
        
        data = response.json()
        assert data.get("_id") == report_id, "Report ID mismatch"
        assert data.get("status") == "en_attente", "Status should be 'en_attente'"
        print(f"✓ Retrieved report: {data.get('category_name')} - Status: {data.get('status')}")
    
    def test_05_take_over_report(self, api_client):
        """POST /api/v2/hotels/:hotelId/reports/:reportId/take-over - Take over a report"""
        report_id = TestReportWorkflowAPIs.created_report_id
        assert report_id, "No report ID from previous test"
        
        payload = {
            "technician_id": "test-tech-1",
            "technician_name": "TEST Technicien"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/take-over",
            json=payload
        )
        assert response.status_code in [200, 201], f"Failed to take over report: {response.text}"
        
        data = response.json()
        assert data.get("status") == "en_cours", "Status should change to 'en_cours'"
        assert data.get("technician_id") == "test-tech-1", "Technician ID mismatch"
        assert data.get("technician_name") == "TEST Technicien", "Technician name mismatch"
        assert data.get("taken_at") is not None, "taken_at should be set"
        print(f"✓ Report taken over by: {data.get('technician_name')}")
    
    def test_06_verify_status_after_takeover(self, api_client):
        """Verify report status changed to 'en_cours' after take-over"""
        report_id = TestReportWorkflowAPIs.created_report_id
        
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "en_cours", "Status should be 'en_cours' after take-over"
        print(f"✓ Verified status is 'en_cours'")
    
    def test_07_add_comment(self, api_client):
        """POST /api/v2/hotels/:hotelId/reports/:reportId/comment - Add a comment"""
        report_id = TestReportWorkflowAPIs.created_report_id
        assert report_id, "No report ID from previous test"
        
        payload = {
            "author_id": "test-tech-1",
            "author_name": "TEST Technicien",
            "content": "TEST - Intervention en cours, pièce commandée"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/comment",
            json=payload
        )
        assert response.status_code in [200, 201], f"Failed to add comment: {response.text}"
        
        data = response.json()
        comments = data.get("comments", [])
        assert len(comments) >= 1, "Should have at least 1 comment"
        
        last_comment = comments[-1]
        assert last_comment.get("content") == "TEST - Intervention en cours, pièce commandée"
        assert last_comment.get("author_name") == "TEST Technicien"
        print(f"✓ Comment added: '{last_comment.get('content')[:50]}...'")
    
    def test_08_add_second_comment(self, api_client):
        """Add another comment to verify multiple comments work"""
        report_id = TestReportWorkflowAPIs.created_report_id
        
        payload = {
            "author_id": "test-tech-1",
            "author_name": "TEST Technicien",
            "content": "TEST - Pièce reçue, réparation terminée"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/comment",
            json=payload
        )
        assert response.status_code in [200, 201]
        
        data = response.json()
        comments = data.get("comments", [])
        assert len(comments) >= 2, "Should have at least 2 comments"
        print(f"✓ Second comment added, total comments: {len(comments)}")
    
    def test_09_add_invoice(self, api_client):
        """POST /api/v2/hotels/:hotelId/reports/:reportId/invoice - Add invoice"""
        report_id = TestReportWorkflowAPIs.created_report_id
        assert report_id, "No report ID from previous test"
        
        payload = {
            "invoice_url": "https://example.com/invoice/test-123.pdf",
            "invoice_amount": 125.50
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/invoice",
            json=payload
        )
        assert response.status_code in [200, 201], f"Failed to add invoice: {response.text}"
        
        data = response.json()
        assert data.get("invoice_amount") == 125.50, "Invoice amount mismatch"
        assert data.get("invoice_url") == "https://example.com/invoice/test-123.pdf", "Invoice URL mismatch"
        print(f"✓ Invoice added: {data.get('invoice_amount')} €")
    
    def test_10_verify_invoice_persisted(self, api_client):
        """Verify invoice data persisted correctly"""
        report_id = TestReportWorkflowAPIs.created_report_id
        
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("invoice_amount") == 125.50, "Invoice amount not persisted"
        print(f"✓ Invoice persisted: {data.get('invoice_amount')} €")
    
    def test_11_resolve_report(self, api_client):
        """POST /api/v2/hotels/:hotelId/reports/:reportId/resolve - Resolve report"""
        report_id = TestReportWorkflowAPIs.created_report_id
        assert report_id, "No report ID from previous test"
        
        payload = {
            "resolution_notes": "TEST - Fuite réparée, joint remplacé",
            "resolved_by_id": "test-tech-1",
            "resolved_by_name": "TEST Technicien"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/resolve",
            json=payload
        )
        assert response.status_code in [200, 201], f"Failed to resolve report: {response.text}"
        
        data = response.json()
        assert data.get("status") == "resolu", "Status should be 'resolu'"
        assert data.get("resolution_notes") == "TEST - Fuite réparée, joint remplacé"
        assert data.get("resolved_at") is not None, "resolved_at should be set"
        print(f"✓ Report resolved with notes: '{data.get('resolution_notes')}'")
    
    def test_12_verify_final_state(self, api_client):
        """Verify final report state after full workflow"""
        report_id = TestReportWorkflowAPIs.created_report_id
        
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify all workflow fields
        assert data.get("status") == "resolu", "Final status should be 'resolu'"
        assert data.get("technician_id") == "test-tech-1", "Technician ID should be set"
        assert data.get("technician_name") == "TEST Technicien", "Technician name should be set"
        assert data.get("taken_at") is not None, "taken_at should be set"
        assert len(data.get("comments", [])) >= 2, "Should have at least 2 comments"
        assert data.get("invoice_amount") == 125.50, "Invoice amount should be set"
        assert data.get("resolution_notes") is not None, "Resolution notes should be set"
        assert data.get("resolved_at") is not None, "resolved_at should be set"
        
        print(f"✓ Final state verified - Full workflow completed successfully")
    
    def test_13_stats_updated_after_workflow(self, api_client):
        """Verify stats are updated after workflow completion"""
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("resolved") >= 1, "Should have at least 1 resolved report"
        print(f"✓ Stats updated: resolved={data.get('resolved')}")


class TestReportWorkflowEdgeCases:
    """Test edge cases and error handling"""
    
    def test_take_over_already_taken_report(self, api_client):
        """Cannot take over a report that's already in progress"""
        # First create a report
        payload = {
            "room_number": "TEST_302",
            "category_name": "TEST_Edge Case",
            "reporter_id": "test-reporter-2",
            "reporter_name": "TEST Reporter 2",
        }
        
        create_response = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports",
            json=payload
        )
        assert create_response.status_code in [200, 201]
        report_id = create_response.json().get("_id")
        
        # Take over the report
        take_over_payload = {
            "technician_id": "tech-1",
            "technician_name": "Technicien 1"
        }
        
        first_take_over = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/take-over",
            json=take_over_payload
        )
        assert first_take_over.status_code in [200, 201]
        
        # Try to take over again - should fail
        second_take_over = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/take-over",
            json={"technician_id": "tech-2", "technician_name": "Technicien 2"}
        )
        assert second_take_over.status_code == 404, "Should not be able to take over already in-progress report"
        print(f"✓ Cannot take over already in-progress report (404 returned)")
        
        # Cleanup - resolve the report
        api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/resolve",
            json={"resolution_notes": "Cleanup", "resolved_by_id": "tech-1", "resolved_by_name": "Tech"}
        )
    
    def test_resolve_already_resolved_report(self, api_client):
        """Cannot resolve a report that's already resolved"""
        # Create and resolve a report
        payload = {
            "room_number": "TEST_303",
            "category_name": "TEST_Already Resolved",
            "reporter_id": "test-reporter-3",
            "reporter_name": "TEST Reporter 3",
        }
        
        create_response = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports",
            json=payload
        )
        report_id = create_response.json().get("_id")
        
        # Take over
        api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/take-over",
            json={"technician_id": "tech-1", "technician_name": "Tech 1"}
        )
        
        # Resolve first time
        first_resolve = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/resolve",
            json={"resolution_notes": "First resolve", "resolved_by_id": "tech-1", "resolved_by_name": "Tech"}
        )
        assert first_resolve.status_code in [200, 201]
        
        # Try to resolve again - should fail
        second_resolve = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/resolve",
            json={"resolution_notes": "Second resolve", "resolved_by_id": "tech-2", "resolved_by_name": "Tech 2"}
        )
        assert second_resolve.status_code == 404, "Should not be able to resolve already resolved report"
        print(f"✓ Cannot resolve already resolved report (404 returned)")
    
    def test_get_nonexistent_report(self, api_client):
        """Get a report that doesn't exist"""
        fake_id = "000000000000000000000000"
        response = api_client.get(f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{fake_id}")
        assert response.status_code == 404, "Should return 404 for non-existent report"
        print(f"✓ Non-existent report returns 404")


class TestInvoiceWithoutURL:
    """Test invoice endpoint when only amount is provided (frontend behavior)"""
    
    def test_invoice_amount_only(self, api_client):
        """Test adding invoice with only amount (no URL) - matches frontend behavior"""
        # Create a report
        payload = {
            "room_number": "TEST_304",
            "category_name": "TEST_Invoice Only Amount",
            "reporter_id": "test-reporter-4",
            "reporter_name": "TEST Reporter 4",
        }
        
        create_response = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports",
            json=payload
        )
        report_id = create_response.json().get("_id")
        
        # Take over
        api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/take-over",
            json={"technician_id": "tech-1", "technician_name": "Tech 1"}
        )
        
        # Add invoice with only amount (no URL) - this is what frontend sends
        invoice_response = api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/invoice",
            json={"invoice_amount": 75.00}  # No invoice_url
        )
        
        # This should now work after the DTO fix
        assert invoice_response.status_code in [200, 201], f"Invoice with amount only should work: {invoice_response.text}"
        data = invoice_response.json()
        assert data.get("invoice_amount") == 75.00, "Invoice amount should be set"
        print(f"✓ Invoice with amount only works: {data.get('invoice_amount')} €")
        
        # Cleanup
        api_client.post(
            f"{BASE_URL}/api/v2/hotels/{HOTEL_ID}/reports/{report_id}/resolve",
            json={"resolution_notes": "Cleanup", "resolved_by_id": "tech-1", "resolved_by_name": "Tech"}
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
