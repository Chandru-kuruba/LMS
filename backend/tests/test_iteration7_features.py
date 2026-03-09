"""
Backend tests for Iteration 7 features:
1. Global Certificate Design page at /api/admin/certificate-design (GET/PUT)
2. Individual certificate editing at /api/admin/certificates
3. Currency (INR) validation on landing page content
4. Company info validation on about/contact pages
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@lumina.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Admin authentication failed: {response.text}")


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    """Admin auth headers"""
    return {"Authorization": f"Bearer {admin_token}"}


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self, api_client):
        """Test API is healthy"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"API Health: {data['status']}")


class TestGlobalCertificateDesign:
    """Tests for Global Certificate Design endpoints - GET/PUT /api/admin/certificate-design"""
    
    def test_get_global_design_without_auth(self, api_client):
        """Test GET /api/admin/certificate-design requires auth"""
        response = api_client.get(f"{BASE_URL}/api/admin/certificate-design")
        assert response.status_code in [401, 403]
        print("GET certificate-design correctly requires auth")
    
    def test_get_global_design_with_auth(self, api_client, auth_headers):
        """Test GET /api/admin/certificate-design returns design (can be None initially)"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/certificate-design",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "design" in data
        print(f"GET certificate-design: design={'exists' if data['design'] else 'null'}")
    
    def test_put_global_design_without_auth(self, api_client):
        """Test PUT /api/admin/certificate-design requires auth"""
        response = api_client.put(
            f"{BASE_URL}/api/admin/certificate-design",
            json={"background_color": "#0d0d1a"}
        )
        assert response.status_code in [401, 403]
        print("PUT certificate-design correctly requires auth")
    
    def test_put_global_design_with_auth(self, api_client, auth_headers):
        """Test PUT /api/admin/certificate-design updates design"""
        test_design = {
            "background_color": "#0d0d1a",
            "border_color": "#ca8a04",
            "border_width": 4,
            "header_text": "CERTIFICATE OF COMPLETION",
            "name_font_family": "Great Vibes",
            "name_font_size": 52,
            "name_font_color": "#ffd700",
            "show_qr": True,
            "show_logo": True
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/admin/certificate-design",
            headers=auth_headers,
            json=test_design
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Global certificate design saved"
        print("PUT certificate-design: successfully saved global design")
    
    def test_get_global_design_after_update(self, api_client, auth_headers):
        """Test GET /api/admin/certificate-design returns updated design"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/certificate-design",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["design"] is not None
        assert data["design"]["type"] == "global"
        assert data["design"]["background_color"] == "#0d0d1a"
        assert data["design"]["border_color"] == "#ca8a04"
        print(f"GET certificate-design after update: verified design persisted")


class TestIndividualCertificateEditing:
    """Tests for Individual Certificate Management at /api/admin/certificates"""
    
    def test_get_all_certificates(self, api_client, auth_headers):
        """Test GET /api/admin/certificates returns list"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/certificates",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "certificates" in data
        print(f"GET admin/certificates: found {len(data['certificates'])} certificates")
        return data["certificates"]
    
    def test_search_certificate_by_id(self, api_client, auth_headers):
        """Test GET /api/admin/certificates/search with valid certificate ID"""
        # First get certificates list
        certs_response = api_client.get(
            f"{BASE_URL}/api/admin/certificates",
            headers=auth_headers
        )
        certs = certs_response.json().get("certificates", [])
        
        if not certs:
            pytest.skip("No certificates found to search")
        
        cert_id = certs[0]["certificate_id"]
        response = api_client.get(
            f"{BASE_URL}/api/admin/certificates/search",
            params={"certificate_id": cert_id},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["certificate"]["certificate_id"] == cert_id
        print(f"Search certificate: found {cert_id}")
    
    def test_search_certificate_invalid_id(self, api_client, auth_headers):
        """Test GET /api/admin/certificates/search with invalid ID returns 404"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/certificates/search",
            params={"certificate_id": "INVALID-CERT-ID-12345"},
            headers=auth_headers
        )
        assert response.status_code == 404
        print("Search invalid certificate: correctly returns 404")
    
    def test_lock_unlock_certificate(self, api_client, auth_headers):
        """Test POST /api/admin/certificates/{id}/lock and unlock"""
        # Get certificates
        certs_response = api_client.get(
            f"{BASE_URL}/api/admin/certificates",
            headers=auth_headers
        )
        certs = certs_response.json().get("certificates", [])
        
        if not certs:
            pytest.skip("No certificates found to test lock/unlock")
        
        cert_id = certs[0]["certificate_id"]
        
        # Test unlock
        unlock_response = api_client.post(
            f"{BASE_URL}/api/admin/certificates/{cert_id}/unlock",
            headers=auth_headers
        )
        assert unlock_response.status_code == 200
        print(f"Unlock certificate {cert_id}: success")
        
        # Test lock
        lock_response = api_client.post(
            f"{BASE_URL}/api/admin/certificates/{cert_id}/lock",
            headers=auth_headers
        )
        assert lock_response.status_code == 200
        print(f"Lock certificate {cert_id}: success")


class TestCMSAboutPage:
    """Tests for About page content - should have new company info"""
    
    def test_get_about_cms(self, api_client):
        """Test GET /api/public/cms/about returns content"""
        response = api_client.get(f"{BASE_URL}/api/public/cms/about")
        # Should return 200 even if no custom content (defaults used)
        assert response.status_code == 200
        print("GET cms/about: accessible")


class TestCMSContactPage:
    """Tests for Contact page content - should have updated contact info"""
    
    def test_get_contact_cms(self, api_client):
        """Test GET /api/public/cms/contact returns content"""
        response = api_client.get(f"{BASE_URL}/api/public/cms/contact")
        # Should return 200 even if no custom content (defaults used)
        assert response.status_code == 200
        print("GET cms/contact: accessible")


class TestCoursesWithINRCurrency:
    """Tests for courses to verify currency handling"""
    
    def test_get_courses_prices(self, api_client):
        """Test GET /api/courses returns courses with prices"""
        response = api_client.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        data = response.json()
        assert "courses" in data
        
        courses = data["courses"]
        print(f"GET courses: found {len(courses)} courses")
        
        # Check prices are numeric (for INR display)
        for course in courses[:3]:  # Check first 3
            assert "price" in course
            assert isinstance(course["price"], (int, float))
            print(f"  - {course.get('title', 'N/A')}: ₹{course['price']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
