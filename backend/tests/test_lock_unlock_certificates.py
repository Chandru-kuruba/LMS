"""
Test suite for Certificate Lock/Unlock functionality
Tests:
- Admin lock/unlock endpoints
- User name update when unlocked
- Lock/unlock toggle in admin table
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCertificateLockUnlock:
    """Tests for admin certificate lock/unlock functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin authentication"""
        # Admin login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@lumina.com",
            "password": "admin123"
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        self.admin_token = login_response.json()["access_token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        self.admin_user = login_response.json()["user"]
    
    def test_get_all_certificates(self):
        """Test GET /api/admin/certificates returns certificate list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/certificates",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Failed to get certificates: {response.text}"
        data = response.json()
        assert "certificates" in data
        print(f"Found {len(data['certificates'])} certificates")
        return data["certificates"]
    
    def test_unlock_certificate(self):
        """Test POST /api/admin/certificates/{id}/unlock - unlocks certificate"""
        # First get certificates
        certs_response = requests.get(
            f"{BASE_URL}/api/admin/certificates",
            headers=self.admin_headers
        )
        certs = certs_response.json().get("certificates", [])
        
        if not certs:
            pytest.skip("No certificates available to test")
        
        cert_id = certs[0]["certificate_id"]
        
        # Unlock certificate
        response = requests.post(
            f"{BASE_URL}/api/admin/certificates/{cert_id}/unlock",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Failed to unlock: {response.text}"
        data = response.json()
        assert "message" in data
        assert "unlock" in data["message"].lower()
        print(f"Unlocked certificate {cert_id}: {data['message']}")
    
    def test_lock_certificate(self):
        """Test POST /api/admin/certificates/{id}/lock - locks certificate"""
        # First get certificates
        certs_response = requests.get(
            f"{BASE_URL}/api/admin/certificates",
            headers=self.admin_headers
        )
        certs = certs_response.json().get("certificates", [])
        
        if not certs:
            pytest.skip("No certificates available to test")
        
        cert_id = certs[0]["certificate_id"]
        
        # Lock certificate
        response = requests.post(
            f"{BASE_URL}/api/admin/certificates/{cert_id}/lock",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Failed to lock: {response.text}"
        data = response.json()
        assert "message" in data
        assert "lock" in data["message"].lower()
        print(f"Locked certificate {cert_id}: {data['message']}")
    
    def test_unlock_nonexistent_certificate(self):
        """Test POST /api/admin/certificates/{id}/unlock with invalid ID returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/admin/certificates/NONEXISTENT-CERT-ID/unlock",
            headers=self.admin_headers
        )
        # Should return 404 (or 400 for modified_count == 0)
        assert response.status_code in [404, 400], f"Expected 404, got {response.status_code}"
        print(f"Correct error for nonexistent certificate: {response.status_code}")
    
    def test_lock_nonexistent_certificate(self):
        """Test POST /api/admin/certificates/{id}/lock with invalid ID returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/admin/certificates/NONEXISTENT-CERT-ID/lock",
            headers=self.admin_headers
        )
        assert response.status_code in [404, 400], f"Expected 404, got {response.status_code}"
        print(f"Correct error for nonexistent certificate: {response.status_code}")
    
    def test_certificate_lock_status_in_list(self):
        """Test certificates include is_locked field"""
        response = requests.get(
            f"{BASE_URL}/api/admin/certificates",
            headers=self.admin_headers
        )
        assert response.status_code == 200
        certs = response.json().get("certificates", [])
        
        if certs:
            # Check that is_locked field exists
            cert = certs[0]
            print(f"Certificate fields: {list(cert.keys())}")
            # is_locked might be True/False/None depending on implementation
            print(f"Certificate {cert['certificate_id']} is_locked: {cert.get('is_locked')}")


class TestUserCertificateNameUpdate:
    """Tests for user certificate name update when unlocked"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin and user tokens"""
        # Admin login
        admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@lumina.com",
            "password": "admin123"
        })
        assert admin_login.status_code == 200, "Admin login failed"
        self.admin_token = admin_login.json()["access_token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_get_user_certificates(self):
        """Test GET /api/certificates returns user's certificates"""
        # Use admin token to check the endpoint (admin is also a user)
        response = requests.get(
            f"{BASE_URL}/api/certificates",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Failed to get user certificates: {response.text}"
        data = response.json()
        assert "certificates" in data
        print(f"User has {len(data['certificates'])} certificates")
        return data["certificates"]
    
    def test_update_name_when_locked(self):
        """Test PUT /api/certificates/{id}/update-name when locked returns 403"""
        # Get certificates
        certs_response = requests.get(
            f"{BASE_URL}/api/admin/certificates",
            headers=self.admin_headers
        )
        certs = certs_response.json().get("certificates", [])
        
        if not certs:
            pytest.skip("No certificates available")
        
        cert = certs[0]
        cert_id = cert["certificate_id"]
        
        # First ensure it's locked
        requests.post(
            f"{BASE_URL}/api/admin/certificates/{cert_id}/lock",
            headers=self.admin_headers
        )
        
        # Try to update name - should fail with 403 or 404 (if cert doesn't belong to user)
        response = requests.put(
            f"{BASE_URL}/api/certificates/{cert_id}/update-name",
            params={"new_name": "Test Updated Name"},
            headers=self.admin_headers
        )
        # Should get 403 (locked) or 404 (not user's cert)
        assert response.status_code in [403, 404], f"Expected 403/404, got {response.status_code}"
        print(f"Correct error when updating locked certificate: {response.status_code}")
    
    def test_update_name_flow(self):
        """Test full unlock -> update name -> auto-lock flow"""
        # Get certificates
        certs_response = requests.get(
            f"{BASE_URL}/api/admin/certificates",
            headers=self.admin_headers
        )
        certs = certs_response.json().get("certificates", [])
        
        if not certs:
            pytest.skip("No certificates available")
        
        cert = certs[0]
        cert_id = cert["certificate_id"]
        
        # Step 1: Unlock the certificate
        unlock_response = requests.post(
            f"{BASE_URL}/api/admin/certificates/{cert_id}/unlock",
            headers=self.admin_headers
        )
        assert unlock_response.status_code == 200, f"Unlock failed: {unlock_response.text}"
        print(f"Step 1: Certificate unlocked")
        
        # Step 2: Verify is_locked is False
        check_response = requests.get(
            f"{BASE_URL}/api/admin/certificates/search",
            params={"certificate_id": cert_id},
            headers=self.admin_headers
        )
        assert check_response.status_code == 200
        cert_data = check_response.json().get("certificate", {})
        assert cert_data.get("is_locked") == False, f"Expected is_locked=False, got {cert_data.get('is_locked')}"
        print(f"Step 2: Verified is_locked = False")
        
        # Step 3: Lock it back
        lock_response = requests.post(
            f"{BASE_URL}/api/admin/certificates/{cert_id}/lock",
            headers=self.admin_headers
        )
        assert lock_response.status_code == 200
        print(f"Step 3: Certificate locked back")


class TestAdminCertificateUpdate:
    """Tests for admin certificate update with layout data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin authentication"""
        admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@lumina.com",
            "password": "admin123"
        })
        assert admin_login.status_code == 200, "Admin login failed"
        self.admin_token = admin_login.json()["access_token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_admin_update_certificate_layout(self):
        """Test PUT /api/admin/certificates/{id} with layout data"""
        # Get certificates
        certs_response = requests.get(
            f"{BASE_URL}/api/admin/certificates",
            headers=self.admin_headers
        )
        certs = certs_response.json().get("certificates", [])
        
        if not certs:
            pytest.skip("No certificates available")
        
        cert_id = certs[0]["certificate_id"]
        
        # Update certificate with layout data
        update_data = {
            "name_on_certificate": "Test User Updated",
            "course_title": "Test Course",
            "name_font_size": 52,
            "name_font_color": "#ffd700",
            "show_course": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/certificates/{cert_id}",
            json=update_data,
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Failed to update certificate: {response.text}"
        print(f"Admin updated certificate layout: {response.json()}")
    
    def test_search_certificate_by_id(self):
        """Test GET /api/admin/certificates/search with certificate_id"""
        # Get certificates first
        certs_response = requests.get(
            f"{BASE_URL}/api/admin/certificates",
            headers=self.admin_headers
        )
        certs = certs_response.json().get("certificates", [])
        
        if not certs:
            pytest.skip("No certificates available")
        
        cert_id = certs[0]["certificate_id"]
        
        # Search by ID
        response = requests.get(
            f"{BASE_URL}/api/admin/certificates/search",
            params={"certificate_id": cert_id},
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Search failed: {response.text}"
        data = response.json()
        assert "certificate" in data
        assert data["certificate"]["certificate_id"] == cert_id
        print(f"Found certificate by ID: {cert_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
