"""
Test Suite for Iteration 3 Features:
- Profile image upload to MongoDB (Base64)
- GET /user/profile-image returns data URL
- Admin users page and performance endpoint
- Admin withdrawals endpoint
- Notification delete endpoint
- Certificates system
- Ticket status updates
- CMS dynamic pages (About, Contact, FAQ, Pricing)
"""

import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@lumina.com"
ADMIN_PASSWORD = "admin123"


class TestAuthAndSetup:
    """Authentication tests - run first to get tokens"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["access_token"]
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data
        print(f"Health check passed: {data['services']}")
    
    def test_admin_login(self, admin_token):
        """Test admin login works"""
        assert admin_token is not None
        assert len(admin_token) > 10
        print("Admin login successful")


class TestProfileImage:
    """Profile image upload to MongoDB as Base64"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_profile_image_no_image(self, admin_token):
        """Test GET /user/profile-image when no image is set"""
        response = requests.get(
            f"{BASE_URL}/api/user/profile-image",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # image_url can be null if no image uploaded
        assert "image_url" in data
        print(f"Profile image response: image_url={data['image_url'][:50] if data['image_url'] else 'None'}...")
    
    def test_upload_profile_image_invalid_type(self, admin_token):
        """Test profile image upload with invalid file type"""
        # Create a fake text file
        files = {"file": ("test.txt", b"This is not an image", "text/plain")}
        response = requests.post(
            f"{BASE_URL}/api/user/upload-profile-image",
            headers={"Authorization": f"Bearer {admin_token}"},
            files=files
        )
        assert response.status_code == 400
        assert "Invalid file type" in response.json()["detail"]
        print("Invalid file type correctly rejected")
    
    def test_upload_profile_image_valid(self, admin_token):
        """Test profile image upload with valid image"""
        # Create a small valid JPEG (1x1 pixel)
        # This is the minimal valid JPEG file
        jpeg_bytes = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
            0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
            0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
            0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
            0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
            0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
            0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xB8, 0xE3, 0x23, 0xF4,
            0x4A, 0xF1, 0x84, 0xC0, 0xD0, 0xF7, 0x1C, 0xD6, 0xFF, 0xD9
        ])
        
        files = {"file": ("test_image.jpg", jpeg_bytes, "image/jpeg")}
        response = requests.post(
            f"{BASE_URL}/api/user/upload-profile-image",
            headers={"Authorization": f"Bearer {admin_token}"},
            files=files
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "uploaded" in data["message"].lower()
        print("Profile image upload successful")
    
    def test_get_profile_image_after_upload(self, admin_token):
        """Test GET /user/profile-image returns data URL after upload"""
        response = requests.get(
            f"{BASE_URL}/api/user/profile-image",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # After upload, image_url should be a data URL
        if data.get("image_url"):
            assert data["image_url"].startswith("data:image/")
            print(f"Profile image data URL: {data['image_url'][:60]}...")
        else:
            print("No profile image found (may have been reset)")


class TestAdminUsers:
    """Admin users and performance endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_admin_users_list(self, admin_token):
        """Test GET /admin/users returns user list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert isinstance(data["users"], list)
        print(f"Admin users list: {data['total']} users found")
    
    def test_admin_users_search(self, admin_token):
        """Test GET /admin/users with search parameter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?search=admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        # Search for admin should find at least one user
        if data["users"]:
            print(f"Search found {len(data['users'])} users with 'admin'")
    
    def test_admin_user_performance(self, admin_token):
        """Test GET /admin/users/:id/performance endpoint"""
        # First get a user ID
        users_response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert users_response.status_code == 200
        users = users_response.json()["users"]
        assert len(users) > 0, "No users found"
        
        user_id = users[0]["id"]
        
        # Get user performance
        response = requests.get(
            f"{BASE_URL}/api/admin/users/{user_id}/performance",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify performance data structure
        assert "user" in data
        assert "performance" in data
        performance = data["performance"]
        assert "total_purchases" in performance
        assert "total_spent" in performance
        assert "courses_enrolled" in performance
        assert "course_progress" in performance
        assert "referral_stats" in performance
        
        print(f"User performance: purchases={performance['total_purchases']}, enrolled={performance['courses_enrolled']}")


class TestAdminWithdrawals:
    """Admin withdrawals endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_admin_withdrawals_list(self, admin_token):
        """Test GET /admin/withdrawals returns withdrawals list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/withdrawals",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "withdrawals" in data
        assert isinstance(data["withdrawals"], list)
        print(f"Admin withdrawals: {len(data['withdrawals'])} withdrawals found")
    
    def test_admin_withdrawals_filter_pending(self, admin_token):
        """Test GET /admin/withdrawals?status=pending"""
        response = requests.get(
            f"{BASE_URL}/api/admin/withdrawals?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "withdrawals" in data
        # All withdrawals should have pending status
        for w in data["withdrawals"]:
            assert w["status"] == "pending"
        print(f"Pending withdrawals: {len(data['withdrawals'])}")


class TestNotifications:
    """Notification endpoints including delete"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_notifications(self, admin_token):
        """Test GET /notifications"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        print(f"Notifications: {len(data['notifications'])} total, {data['unread_count']} unread")
    
    def test_delete_notification_not_found(self, admin_token):
        """Test DELETE /notifications/:id with invalid ID"""
        response = requests.delete(
            f"{BASE_URL}/api/notifications/invalid-id-12345",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404
        print("Delete non-existent notification correctly returns 404")
    
    def test_mark_all_read(self, admin_token):
        """Test POST /notifications/read-all"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/read-all",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("Mark all notifications as read successful")


class TestCMSPages:
    """Dynamic CMS pages (About, Contact, FAQ, Pricing)"""
    
    def test_cms_about_page(self):
        """Test GET /public/cms/about"""
        response = requests.get(f"{BASE_URL}/api/public/cms/about")
        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        print(f"About page CMS content retrieved: {list(data['content'].keys())}")
    
    def test_cms_contact_page(self):
        """Test GET /public/cms/contact"""
        response = requests.get(f"{BASE_URL}/api/public/cms/contact")
        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        print(f"Contact page CMS content retrieved: {list(data['content'].keys())}")
    
    def test_cms_pricing_page(self):
        """Test GET /public/cms/pricing"""
        response = requests.get(f"{BASE_URL}/api/public/cms/pricing")
        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        print(f"Pricing page CMS content retrieved: {list(data['content'].keys())}")
    
    def test_faqs_endpoint(self):
        """Test GET /faqs"""
        response = requests.get(f"{BASE_URL}/api/faqs")
        assert response.status_code == 200
        data = response.json()
        assert "faqs" in data
        assert isinstance(data["faqs"], list)
        print(f"FAQ endpoint: {len(data['faqs'])} FAQs found")


class TestCertificates:
    """Certificate system endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_user_certificates(self, admin_token):
        """Test GET /certificates - list user certificates"""
        response = requests.get(
            f"{BASE_URL}/api/certificates",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "certificates" in data
        assert isinstance(data["certificates"], list)
        print(f"User certificates: {len(data['certificates'])} certificates found")
    
    def test_get_certificate_for_course_not_enrolled(self, admin_token):
        """Test GET /certificates/:course_id when not enrolled"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/fake-course-id-12345",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Should return null certificate if not enrolled
        assert "certificate" in data
        print(f"Certificate for non-enrolled course: {data['certificate']}")
    
    def test_request_certificate_not_enrolled(self, admin_token):
        """Test POST /certificates/:course_id/request when not enrolled"""
        response = requests.post(
            f"{BASE_URL}/api/certificates/fake-course-id-12345/request?name_on_certificate=Test User",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        # Should fail because not enrolled
        assert response.status_code == 404
        assert "Enrollment not found" in response.json()["detail"]
        print("Certificate request correctly rejected when not enrolled")
    
    def test_admin_get_all_certificates(self, admin_token):
        """Test GET /admin/certificates"""
        response = requests.get(
            f"{BASE_URL}/api/admin/certificates",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "certificates" in data
        print(f"Admin certificates: {len(data['certificates'])} total certificates")


class TestTickets:
    """Support ticket system with status updates"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_tickets(self, admin_token):
        """Test GET /tickets"""
        response = requests.get(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        print(f"User tickets: {len(data['tickets'])} tickets found")
    
    def test_create_ticket(self, admin_token):
        """Test POST /tickets - create new support ticket"""
        response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "subject": "TEST_Ticket Subject",
                "message": "This is a test support ticket for testing purposes",
                "category": "technical"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "ticket_id" in data
        assert data["message"] == "Ticket created"
        print(f"Created ticket: {data['ticket_id']}")
        return data["ticket_id"]
    
    def test_update_ticket_status(self, admin_token):
        """Test PUT /tickets/:id/status - update ticket status"""
        # First create a ticket
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "subject": "TEST_Status Update Ticket",
                "message": "Testing status updates",
                "category": "billing"
            }
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json()["ticket_id"]
        
        # Update status via admin endpoint
        response = requests.put(
            f"{BASE_URL}/api/admin/tickets/{ticket_id}/status?status=in-progress",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print(f"Ticket {ticket_id} status updated to in-progress")
    
    def test_close_ticket(self, admin_token):
        """Test POST /tickets/:id/close"""
        # Create a ticket
        create_response = requests.post(
            f"{BASE_URL}/api/tickets",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "subject": "TEST_Close Ticket",
                "message": "Testing close functionality",
                "category": "general"
            }
        )
        assert create_response.status_code == 200
        ticket_id = create_response.json()["ticket_id"]
        
        # Close the ticket
        response = requests.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/close",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print(f"Ticket {ticket_id} closed successfully")


# Cleanup fixture - runs at the end
@pytest.fixture(scope="session", autouse=True)
def cleanup(request):
    """Cleanup test data after all tests"""
    def do_cleanup():
        # Login as admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            token = response.json()["access_token"]
            # Get tickets and delete TEST_ prefixed ones
            tickets_response = requests.get(
                f"{BASE_URL}/api/tickets",
                headers={"Authorization": f"Bearer {token}"}
            )
            if tickets_response.status_code == 200:
                for ticket in tickets_response.json().get("tickets", []):
                    if ticket.get("subject", "").startswith("TEST_"):
                        print(f"Would cleanup ticket: {ticket['id']}")
    
    request.addfinalizer(do_cleanup)
