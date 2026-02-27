"""
Lumina LMS Backend API Tests
Tests for health, auth, courses, cart, and FAQs endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_ADMIN_EMAIL = "admin@lumina.com"
TEST_ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_ADMIN_EMAIL,
        "password": TEST_ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, admin_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


# ======================== Health Check Tests ========================

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_returns_200(self, api_client):
        """Test health endpoint returns 200"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Health check returns 200")
    
    def test_health_services_configured(self, api_client):
        """Test health shows configured services"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        
        assert "services" in data, "Response should contain 'services' key"
        services = data["services"]
        
        assert services.get("database") == "connected", "Database should be connected"
        assert services.get("smtp") == "configured", "SMTP should be configured"
        assert services.get("r2_storage") == "configured", "R2 storage should be configured"
        assert services.get("payu") == "configured", "PayU should be configured"
        
        print(f"PASS: All services configured: {services}")


# ======================== Auth Tests ========================

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self, api_client):
        """Test admin login with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_ADMIN_EMAIL,
            "password": TEST_ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert "refresh_token" in data, "Response should contain refresh_token"
        assert "user" in data, "Response should contain user"
        
        user = data["user"]
        assert user["email"] == TEST_ADMIN_EMAIL, "User email should match"
        assert user["role"] == "admin", "User role should be admin"
        assert user["is_verified"] == True, "User should be verified"
        
        print(f"PASS: Admin login successful, user: {user['email']}")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401 for invalid credentials, got {response.status_code}"
        print("PASS: Invalid credentials return 401")
    
    def test_user_registration(self, api_client):
        """Test user registration creates new user"""
        test_email = f"TEST_user_{int(time.time())}@example.com"
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPassword123",
            "first_name": "Test",
            "last_name": "User"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert data["email"] == test_email, "Response email should match"
        
        print(f"PASS: User registration successful for {test_email}")
    
    def test_duplicate_registration_fails(self, api_client):
        """Test duplicate email registration fails"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_ADMIN_EMAIL,  # Already exists
            "password": "TestPassword123",
            "first_name": "Test",
            "last_name": "User"
        })
        
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"
        print("PASS: Duplicate registration returns 400")
    
    def test_get_current_user(self, authenticated_client):
        """Test get current user endpoint"""
        response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["email"] == TEST_ADMIN_EMAIL, "Email should match admin"
        assert data["role"] == "admin", "Role should be admin"
        assert "password" not in data, "Password should not be in response"
        
        print(f"PASS: Get current user successful: {data['email']}")


# ======================== Courses Tests ========================

class TestCourses:
    """Course endpoint tests"""
    
    def test_get_courses_list(self, api_client):
        """Test courses list endpoint returns courses"""
        response = api_client.get(f"{BASE_URL}/api/courses")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "courses" in data, "Response should contain courses"
        assert "total" in data, "Response should contain total"
        assert "page" in data, "Response should contain page"
        
        courses = data["courses"]
        assert len(courses) > 0, "Should have at least one course"
        
        # Verify course structure
        course = courses[0]
        assert "id" in course, "Course should have id"
        assert "title" in course, "Course should have title"
        assert "price" in course, "Course should have price"
        assert "category" in course, "Course should have category"
        
        print(f"PASS: Got {len(courses)} courses, total: {data['total']}")
    
    def test_get_course_detail(self, api_client):
        """Test course detail endpoint"""
        # First get courses list to get a course ID
        list_response = api_client.get(f"{BASE_URL}/api/courses")
        assert list_response.status_code == 200
        
        courses = list_response.json()["courses"]
        assert len(courses) > 0, "Need at least one course"
        
        course_id = courses[0]["id"]
        
        # Get course detail
        response = api_client.get(f"{BASE_URL}/api/courses/{course_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["id"] == course_id, "Course ID should match"
        assert "modules" in data, "Course detail should include modules"
        assert "reviews" in data, "Course detail should include reviews"
        
        print(f"PASS: Got course detail for: {data['title']}")
    
    def test_course_not_found(self, api_client):
        """Test non-existent course returns 404"""
        response = api_client.get(f"{BASE_URL}/api/courses/non-existent-id")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Non-existent course returns 404")
    
    def test_get_categories(self, api_client):
        """Test categories endpoint"""
        response = api_client.get(f"{BASE_URL}/api/courses/categories")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "categories" in data, "Response should contain categories"
        
        print(f"PASS: Got categories: {data['categories']}")


# ======================== Cart Tests ========================

class TestCart:
    """Cart endpoint tests (authenticated)"""
    
    def test_get_empty_cart(self, authenticated_client):
        """Test get cart returns empty cart"""
        response = authenticated_client.get(f"{BASE_URL}/api/cart")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "items" in data, "Response should contain items"
        assert "total" in data, "Response should contain total"
        
        print(f"PASS: Got cart with {len(data['items'])} items, total: {data['total']}")
    
    def test_add_to_cart(self, authenticated_client):
        """Test add course to cart"""
        # Get a course first
        courses_response = authenticated_client.get(f"{BASE_URL}/api/courses")
        courses = courses_response.json()["courses"]
        assert len(courses) > 0, "Need at least one course"
        
        course_id = courses[0]["id"]
        
        # Add to cart
        response = authenticated_client.post(f"{BASE_URL}/api/cart", json={
            "course_id": course_id
        })
        
        # May be 200 if added, or 400 if already in cart/enrolled
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "id" in data, "Response should contain cart item id"
            print(f"PASS: Added course {course_id} to cart")
        else:
            print(f"PASS: Course already in cart or enrolled (expected behavior)")
    
    def test_cart_unauthenticated(self, api_client):
        """Test cart requires authentication"""
        # Create new session without auth
        unauthenticated = requests.Session()
        response = unauthenticated.get(f"{BASE_URL}/api/cart")
        
        assert response.status_code == 401, f"Expected 401 for unauthenticated, got {response.status_code}"
        print("PASS: Cart requires authentication (401)")


# ======================== FAQs Tests ========================

class TestFAQs:
    """FAQ endpoint tests"""
    
    def test_get_faqs(self, api_client):
        """Test FAQs endpoint returns FAQs"""
        response = api_client.get(f"{BASE_URL}/api/faqs")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "faqs" in data, "Response should contain faqs"
        
        faqs = data["faqs"]
        assert len(faqs) > 0, "Should have at least one FAQ"
        
        # Verify FAQ structure
        faq = faqs[0]
        assert "id" in faq, "FAQ should have id"
        assert "question" in faq, "FAQ should have question"
        assert "answer" in faq, "FAQ should have answer"
        
        print(f"PASS: Got {len(faqs)} FAQs")


# ======================== Admin Tests ========================

class TestAdmin:
    """Admin endpoint tests"""
    
    def test_admin_dashboard(self, authenticated_client):
        """Test admin dashboard"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/dashboard")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "total_users" in data, "Response should contain total_users"
        assert "total_courses" in data, "Response should contain total_courses"
        assert "total_revenue" in data, "Response should contain total_revenue"
        
        print(f"PASS: Admin dashboard - Users: {data['total_users']}, Courses: {data['total_courses']}")
    
    def test_admin_users_list(self, authenticated_client):
        """Test admin users list"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/users")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "users" in data, "Response should contain users"
        
        print(f"PASS: Admin got {len(data['users'])} users")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
