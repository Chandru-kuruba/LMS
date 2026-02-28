"""
Test Admin Notifications and Certificate Management APIs
- Admin Notifications: list, send, delete
- Admin Certificates: list, search, edit
- Certificate Templates: list, create, delete
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials from test request
ADMIN_EMAIL = "admin@lumina.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    return data.get("access_token") or data.get("token")


@pytest.fixture
def admin_headers(admin_token):
    """Headers with admin auth"""
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }


class TestAdminNotifications:
    """Admin Notification endpoints tests"""

    def test_get_notifications_list(self, admin_headers):
        """Test getting all sent notifications"""
        response = requests.get(f"{BASE_URL}/api/admin/notifications", headers=admin_headers)
        assert response.status_code == 200, f"Failed to get notifications: {response.text}"
        data = response.json()
        assert "notifications" in data
        print(f"Found {len(data['notifications'])} notifications")

    def test_send_notification_to_all_users(self, admin_headers):
        """Test sending notification to all users"""
        payload = {
            "title": "TEST_Notification_All",
            "message": "This is a test notification for all users",
            "type": "announcement",
            "send_email": False,
            "audience": "all",
            "user_ids": None
        }
        response = requests.post(f"{BASE_URL}/api/admin/notifications/send", 
                                json=payload, headers=admin_headers)
        assert response.status_code == 200, f"Failed to send notification: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"Send notification response: {data}")

    def test_send_notification_validates_empty_title(self, admin_headers):
        """Test that empty title is rejected"""
        payload = {
            "title": "",
            "message": "Some message",
            "type": "announcement"
        }
        response = requests.post(f"{BASE_URL}/api/admin/notifications/send",
                                json=payload, headers=admin_headers)
        assert response.status_code == 400, "Should reject empty title"

    def test_send_notification_validates_empty_message(self, admin_headers):
        """Test that empty message is rejected"""
        payload = {
            "title": "Title",
            "message": "",
            "type": "announcement"
        }
        response = requests.post(f"{BASE_URL}/api/admin/notifications/send",
                                json=payload, headers=admin_headers)
        assert response.status_code == 400, "Should reject empty message"

    def test_delete_notification(self, admin_headers):
        """Test deleting a notification"""
        # First send a notification
        payload = {
            "title": "TEST_To_Delete",
            "message": "This will be deleted",
            "type": "update",
            "send_email": False
        }
        send_response = requests.post(f"{BASE_URL}/api/admin/notifications/send",
                                      json=payload, headers=admin_headers)
        assert send_response.status_code == 200
        
        # Get notification list to find the one we created
        list_response = requests.get(f"{BASE_URL}/api/admin/notifications", headers=admin_headers)
        notifications = list_response.json().get("notifications", [])
        
        # Find our test notification
        test_notif = next((n for n in notifications if n.get("title") == "TEST_To_Delete"), None)
        if test_notif:
            # Delete it
            delete_response = requests.delete(
                f"{BASE_URL}/api/admin/notifications/{test_notif['id']}", 
                headers=admin_headers
            )
            assert delete_response.status_code == 200, f"Failed to delete: {delete_response.text}"
            print("Successfully deleted test notification")


class TestAdminCertificates:
    """Admin Certificate Management endpoints tests"""

    def test_get_all_certificates(self, admin_headers):
        """Test getting all certificates"""
        response = requests.get(f"{BASE_URL}/api/admin/certificates", headers=admin_headers)
        assert response.status_code == 200, f"Failed to get certificates: {response.text}"
        data = response.json()
        assert "certificates" in data
        print(f"Found {len(data['certificates'])} certificates")
        return data["certificates"]

    def test_search_certificate_by_id(self, admin_headers):
        """Test searching certificate by ID"""
        # First get all certificates
        list_response = requests.get(f"{BASE_URL}/api/admin/certificates", headers=admin_headers)
        certificates = list_response.json().get("certificates", [])
        
        if not certificates:
            pytest.skip("No certificates to search")
        
        # Search for the first certificate
        cert_id = certificates[0].get("certificate_id")
        response = requests.get(
            f"{BASE_URL}/api/admin/certificates/search",
            params={"certificate_id": cert_id},
            headers=admin_headers
        )
        assert response.status_code == 200, f"Search failed: {response.text}"
        data = response.json()
        assert "certificate" in data
        assert data["certificate"]["certificate_id"] == cert_id
        print(f"Successfully found certificate: {cert_id}")

    def test_search_certificate_not_found(self, admin_headers):
        """Test searching for non-existent certificate"""
        response = requests.get(
            f"{BASE_URL}/api/admin/certificates/search",
            params={"certificate_id": "NON_EXISTENT_CERT_ID_12345"},
            headers=admin_headers
        )
        assert response.status_code == 404, "Should return 404 for non-existent certificate"

    def test_update_certificate(self, admin_headers):
        """Test updating certificate details"""
        # First get all certificates
        list_response = requests.get(f"{BASE_URL}/api/admin/certificates", headers=admin_headers)
        certificates = list_response.json().get("certificates", [])
        
        if not certificates:
            pytest.skip("No certificates to update")
        
        cert = certificates[0]
        cert_id = cert.get("certificate_id")
        original_name = cert.get("name_on_certificate", "Original Name")
        
        # Update certificate
        update_payload = {
            "name_on_certificate": f"TEST_Updated_{original_name[:20]}",
            "course_title": cert.get("course_title", "Test Course")
        }
        response = requests.put(
            f"{BASE_URL}/api/admin/certificates/{cert_id}",
            json=update_payload,
            headers=admin_headers
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        # Verify the update
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/certificates/search",
            params={"certificate_id": cert_id},
            headers=admin_headers
        )
        updated_cert = verify_response.json().get("certificate", {})
        assert "TEST_Updated" in updated_cert.get("name_on_certificate", ""), "Update not persisted"
        
        # Restore original name
        restore_payload = {"name_on_certificate": original_name}
        requests.put(f"{BASE_URL}/api/admin/certificates/{cert_id}", 
                    json=restore_payload, headers=admin_headers)
        print(f"Successfully updated and restored certificate: {cert_id}")

    def test_unlock_certificate_name(self, admin_headers):
        """Test unlocking certificate name for user editing"""
        # Get certificates
        list_response = requests.get(f"{BASE_URL}/api/admin/certificates", headers=admin_headers)
        certificates = list_response.json().get("certificates", [])
        
        if not certificates:
            pytest.skip("No certificates to unlock")
        
        cert_id = certificates[0].get("certificate_id")
        response = requests.post(
            f"{BASE_URL}/api/admin/certificates/{cert_id}/unlock-name",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Unlock failed: {response.text}"
        print(f"Successfully unlocked certificate name: {cert_id}")


class TestCertificateTemplates:
    """Certificate Template endpoints tests"""

    def test_get_certificate_templates(self, admin_headers):
        """Test getting all certificate templates"""
        response = requests.get(f"{BASE_URL}/api/admin/certificate-templates", headers=admin_headers)
        assert response.status_code == 200, f"Failed to get templates: {response.text}"
        data = response.json()
        assert "templates" in data
        print(f"Found {len(data['templates'])} templates")

    def test_create_certificate_template(self, admin_headers):
        """Test creating a new certificate template"""
        payload = {
            "name": "TEST_Template_Pytest",
            "background_image": "",
            "name_position": {"x": 500, "y": 350},
            "cert_id_position": {"x": 500, "y": 650},
            "date_position": {"x": 500, "y": 600},
            "font_family": "Great Vibes",
            "font_size": 48,
            "font_color": "#8B5CF6"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates",
            json=payload,
            headers=admin_headers
        )
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "template" in data
        print(f"Created template: {data['template']['id']}")
        return data["template"]["id"]

    def test_delete_certificate_template(self, admin_headers):
        """Test deleting a certificate template"""
        # First create a template to delete
        payload = {
            "name": "TEST_To_Delete_Pytest",
            "font_family": "Montserrat",
            "font_size": 36,
            "font_color": "#00FF00"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates",
            json=payload,
            headers=admin_headers
        )
        if create_response.status_code != 200:
            pytest.skip("Could not create template to delete")
        
        template_id = create_response.json().get("template", {}).get("id")
        
        # Delete the template
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/certificate-templates/{template_id}",
            headers=admin_headers
        )
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        print(f"Successfully deleted template: {template_id}")


class TestAdminUsersForNotifications:
    """Test admin users endpoint used for notification recipients"""

    def test_get_users_list(self, admin_headers):
        """Test getting users list for notification targeting"""
        response = requests.get(f"{BASE_URL}/api/admin/users?limit=500", headers=admin_headers)
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        data = response.json()
        assert "users" in data
        print(f"Found {len(data['users'])} users for notification targeting")


# Cleanup test notifications after tests
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(admin_token):
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    
    # Cleanup test notifications
    try:
        list_response = requests.get(f"{BASE_URL}/api/admin/notifications", headers=headers)
        if list_response.status_code == 200:
            notifications = list_response.json().get("notifications", [])
            for notif in notifications:
                if notif.get("title", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/admin/notifications/{notif['id']}", headers=headers)
    except Exception as e:
        print(f"Cleanup warning: {e}")
    
    # Cleanup test templates
    try:
        list_response = requests.get(f"{BASE_URL}/api/admin/certificate-templates", headers=headers)
        if list_response.status_code == 200:
            templates = list_response.json().get("templates", [])
            for template in templates:
                if template.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/admin/certificate-templates/{template['id']}", headers=headers)
    except Exception as e:
        print(f"Cleanup warning: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
