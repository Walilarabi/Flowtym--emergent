"""
PMS Integration Tests - Testing PMS iframe integration endpoints
Tests for:
1. /api/pms-app endpoint (serves flowtym-pms.html)
2. /api/pms-plan3d endpoint (serves plan3d.html)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('VITE_BACKEND_URL', 'https://reception-suite-1.preview.emergentagent.com')


class TestPMSEndpoints:
    """Test PMS HTML serving endpoints"""
    
    def test_pms_app_endpoint_returns_200(self):
        """Test that /api/pms-app returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/pms-app")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/pms-app returns 200")
    
    def test_pms_app_returns_html_content(self):
        """Test that /api/pms-app returns HTML content"""
        response = requests.get(f"{BASE_URL}/api/pms-app")
        assert response.status_code == 200
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        assert 'text/html' in content_type, f"Expected text/html, got {content_type}"
        
        # Check HTML structure
        content = response.text
        assert '<!DOCTYPE html>' in content, "Missing DOCTYPE"
        assert '<html' in content, "Missing html tag"
        assert 'Flowtym PMS' in content, "Missing Flowtym PMS title"
        print("✓ /api/pms-app returns valid HTML content")
    
    def test_pms_app_has_iframe_detection(self):
        """Test that PMS HTML has iframe detection script for embedded mode"""
        response = requests.get(f"{BASE_URL}/api/pms-app")
        assert response.status_code == 200
        
        content = response.text
        # Check for iframe detection script
        assert 'embedded-mode' in content, "Missing embedded-mode class handling"
        assert 'window.self!==window.top' in content or 'window.self !== window.top' in content, "Missing iframe detection"
        print("✓ /api/pms-app has iframe detection for embedded mode")
    
    def test_pms_app_has_topbar_hide_css(self):
        """Test that PMS HTML has CSS to hide topbar in embedded mode"""
        response = requests.get(f"{BASE_URL}/api/pms-app")
        assert response.status_code == 200
        
        content = response.text
        # Check for CSS rule that hides topbar in embedded mode
        assert 'html.embedded-mode .topbar' in content, "Missing embedded-mode topbar CSS rule"
        assert 'display:none' in content or 'display: none' in content, "Missing display:none for topbar"
        print("✓ /api/pms-app has CSS to hide topbar in embedded mode")
    
    def test_pms_plan3d_endpoint_returns_200(self):
        """Test that /api/pms-plan3d returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/pms-plan3d")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/pms-plan3d returns 200")
    
    def test_pms_plan3d_returns_html_content(self):
        """Test that /api/pms-plan3d returns HTML content"""
        response = requests.get(f"{BASE_URL}/api/pms-plan3d")
        assert response.status_code == 200
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        assert 'text/html' in content_type, f"Expected text/html, got {content_type}"
        
        # Check HTML structure
        content = response.text
        assert '<!DOCTYPE html>' in content, "Missing DOCTYPE"
        assert '<html' in content, "Missing html tag"
        print("✓ /api/pms-plan3d returns valid HTML content")
    
    def test_pms_app_has_navigation_elements(self):
        """Test that PMS HTML has internal navigation elements"""
        response = requests.get(f"{BASE_URL}/api/pms-app")
        assert response.status_code == 200
        
        content = response.text
        # Check for navigation elements (Planning, Reservations, etc.)
        nav_elements = ['Planning', 'Réservations', 'Check-in', 'Clients', 'Tarifs']
        found_elements = [elem for elem in nav_elements if elem in content]
        assert len(found_elements) >= 3, f"Missing navigation elements. Found: {found_elements}"
        print(f"✓ /api/pms-app has navigation elements: {found_elements}")


class TestPMSEndpointErrors:
    """Test error handling for PMS endpoints"""
    
    def test_pms_app_method_not_allowed(self):
        """Test that POST to /api/pms-app returns 405"""
        response = requests.post(f"{BASE_URL}/api/pms-app")
        assert response.status_code == 405, f"Expected 405, got {response.status_code}"
        print("✓ POST /api/pms-app returns 405 Method Not Allowed")
    
    def test_pms_plan3d_method_not_allowed(self):
        """Test that POST to /api/pms-plan3d returns 405"""
        response = requests.post(f"{BASE_URL}/api/pms-plan3d")
        assert response.status_code == 405, f"Expected 405, got {response.status_code}"
        print("✓ POST /api/pms-plan3d returns 405 Method Not Allowed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
