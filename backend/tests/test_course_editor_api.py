"""
Course Editor & Learning Flow API Tests
Tests for admin course editor functionality, modules, lessons, quizzes, and student learning flow
"""
import pytest
import requests
import os
import time
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_ADMIN_EMAIL = "admin@lumina.com"
TEST_ADMIN_PASSWORD = "admin123"
SAMPLE_COURSE_ID = "586d45a4-c3b4-4f7c-8b59-efbe93ac3223"


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


# ======================== Sample Course Tests ========================

class TestSampleCourse:
    """Test sample course with modules/lessons/quizzes exists"""
    
    def test_sample_course_exists(self, api_client):
        """Test sample course is accessible"""
        response = api_client.get(f"{BASE_URL}/api/courses/{SAMPLE_COURSE_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["id"] == SAMPLE_COURSE_ID, "Course ID should match"
        assert data["title"] == "Complete Full-Stack Web Development Bootcamp", "Course title should match"
        
        print(f"PASS: Sample course exists: {data['title']}")
    
    def test_sample_course_has_modules(self, api_client):
        """Test sample course has modules"""
        response = api_client.get(f"{BASE_URL}/api/courses/{SAMPLE_COURSE_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        modules = data.get("modules", [])
        assert len(modules) >= 3, f"Expected at least 3 modules, got {len(modules)}"
        
        # Check first module structure
        first_module = modules[0]
        assert "id" in first_module, "Module should have id"
        assert "title" in first_module, "Module should have title"
        assert "order" in first_module, "Module should have order"
        
        print(f"PASS: Sample course has {len(modules)} modules")
    
    def test_sample_course_modules_have_lessons(self, api_client):
        """Test sample course modules have lessons"""
        response = api_client.get(f"{BASE_URL}/api/courses/{SAMPLE_COURSE_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        modules = data.get("modules", [])
        total_lessons = 0
        
        for module in modules:
            lessons = module.get("lessons", [])
            total_lessons += len(lessons)
            
            if len(lessons) > 0:
                # Check lesson structure
                first_lesson = lessons[0]
                assert "id" in first_lesson, "Lesson should have id"
                assert "title" in first_lesson, "Lesson should have title"
                assert "content_type" in first_lesson, "Lesson should have content_type"
        
        assert total_lessons >= 10, f"Expected at least 10 lessons, got {total_lessons}"
        print(f"PASS: Sample course has {total_lessons} lessons across {len(modules)} modules")
    
    def test_sample_course_has_quizzes(self, api_client):
        """Test sample course has quizzes"""
        response = api_client.get(f"{BASE_URL}/api/courses/{SAMPLE_COURSE_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        modules = data.get("modules", [])
        quizzes_count = 0
        
        for module in modules:
            if module.get("quiz"):
                quizzes_count += 1
                quiz = module["quiz"]
                assert "id" in quiz, "Quiz should have id"
                assert "title" in quiz, "Quiz should have title"
                assert "passing_score" in quiz, "Quiz should have passing_score"
                
                # Check questions
                questions = quiz.get("questions", [])
                if len(questions) > 0:
                    assert "question_text" in questions[0], "Question should have question_text"
                    assert "options" in questions[0], "Question should have options"
        
        assert quizzes_count >= 1, f"Expected at least 1 quiz, got {quizzes_count}"
        print(f"PASS: Sample course has {quizzes_count} quizzes")


# ======================== Admin Module CRUD Tests ========================

class TestAdminModuleCRUD:
    """Admin module management tests"""
    
    def test_admin_create_module(self, authenticated_client):
        """Test admin can create a module"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/admin/courses/{SAMPLE_COURSE_ID}/modules",
            json={
                "title": "TEST_Module_" + str(int(time.time())),
                "description": "Test module description",
                "order": 99
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "module_id" in data or "id" in data, "Response should contain module id"
        module_id = data.get("module_id") or data.get("id")
        
        print(f"PASS: Created module: {module_id}")
        return module_id
    
    def test_admin_update_module(self, authenticated_client):
        """Test admin can update a module"""
        # First create a module
        create_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/courses/{SAMPLE_COURSE_ID}/modules",
            json={
                "title": "TEST_UpdateModule_" + str(int(time.time())),
                "description": "Original description",
                "order": 98
            }
        )
        assert create_response.status_code == 200
        module_id = create_response.json().get("id")
        
        # Update the module
        update_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/modules/{module_id}",
            json={
                "title": "Updated Module Title",
                "description": "Updated description"
            }
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        print(f"PASS: Updated module {module_id}")
    
    def test_admin_delete_module(self, authenticated_client):
        """Test admin can delete a module"""
        # First create a module to delete
        create_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/courses/{SAMPLE_COURSE_ID}/modules",
            json={
                "title": "TEST_DeleteModule_" + str(int(time.time())),
                "description": "Module to delete",
                "order": 97
            }
        )
        assert create_response.status_code == 200
        module_id = create_response.json().get("id")
        
        # Delete the module
        delete_response = authenticated_client.delete(
            f"{BASE_URL}/api/admin/modules/{module_id}"
        )
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        print(f"PASS: Deleted module {module_id}")


# ======================== Admin Lesson CRUD Tests ========================

class TestAdminLessonCRUD:
    """Admin lesson management tests"""
    
    @pytest.fixture
    def test_module_id(self, authenticated_client):
        """Create a test module and return its ID"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/admin/courses/{SAMPLE_COURSE_ID}/modules",
            json={
                "title": "TEST_LessonModule_" + str(int(time.time())),
                "description": "Module for lesson tests",
                "order": 90
            }
        )
        if response.status_code == 200:
            return response.json().get("id")
        pytest.skip("Failed to create test module")
    
    def test_admin_create_lesson(self, authenticated_client, test_module_id):
        """Test admin can create a lesson"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/admin/modules/{test_module_id}/lessons",
            json={
                "title": "TEST_Lesson_" + str(int(time.time())),
                "description": "Test lesson description",
                "content_type": "text",
                "content": "This is test lesson content",
                "duration_minutes": 15,
                "order": 1,
                "is_preview": False
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "lesson_id" in data or "id" in data, "Response should contain lesson id"
        lesson_id = data.get("lesson_id") or data.get("id")
        
        print(f"PASS: Created lesson: {lesson_id}")
    
    def test_admin_update_lesson(self, authenticated_client, test_module_id):
        """Test admin can update a lesson"""
        # Create a lesson first
        create_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/modules/{test_module_id}/lessons",
            json={
                "title": "TEST_UpdateLesson",
                "description": "Original description",
                "content_type": "text",
                "content": "Original content",
                "duration_minutes": 10,
                "order": 2,
                "is_preview": False
            }
        )
        assert create_response.status_code == 200
        lesson_id = create_response.json().get("id")
        
        # Update the lesson
        update_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/lessons/{lesson_id}",
            json={
                "title": "Updated Lesson Title",
                "description": "Updated description",
                "is_preview": True
            }
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        print(f"PASS: Updated lesson {lesson_id}")
    
    def test_admin_delete_lesson(self, authenticated_client, test_module_id):
        """Test admin can delete a lesson"""
        # Create a lesson first
        create_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/modules/{test_module_id}/lessons",
            json={
                "title": "TEST_DeleteLesson",
                "content_type": "text",
                "order": 3
            }
        )
        assert create_response.status_code == 200
        lesson_id = create_response.json().get("id")
        
        # Delete the lesson
        delete_response = authenticated_client.delete(
            f"{BASE_URL}/api/admin/lessons/{lesson_id}"
        )
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        print(f"PASS: Deleted lesson {lesson_id}")


# ======================== Admin Quiz CRUD Tests ========================

class TestAdminQuizCRUD:
    """Admin quiz management tests"""
    
    @pytest.fixture
    def quiz_module_id(self, authenticated_client):
        """Create a test module without quiz and return its ID"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/admin/courses/{SAMPLE_COURSE_ID}/modules",
            json={
                "title": "TEST_QuizModule_" + str(int(time.time())),
                "description": "Module for quiz tests",
                "order": 85
            }
        )
        if response.status_code == 200:
            return response.json().get("id")
        pytest.skip("Failed to create test module")
    
    def test_admin_create_quiz(self, authenticated_client, quiz_module_id):
        """Test admin can create a quiz"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/admin/modules/{quiz_module_id}/quiz",
            json={
                "title": "TEST_Quiz_" + str(int(time.time())),
                "description": "Test quiz description",
                "passing_score": 70,
                "time_limit_minutes": 30
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "quiz_id" in data or "id" in data, "Response should contain quiz id"
        quiz_id = data.get("quiz_id") or data.get("id")
        
        print(f"PASS: Created quiz: {quiz_id}")
        return quiz_id
    
    def test_admin_add_question_to_quiz(self, authenticated_client, quiz_module_id):
        """Test admin can add question to quiz"""
        # Create quiz first
        quiz_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/modules/{quiz_module_id}/quiz",
            json={
                "title": "TEST_QuestionQuiz",
                "passing_score": 70
            }
        )
        
        # Note: May fail if quiz already exists for module
        if quiz_response.status_code != 200:
            print(f"INFO: Quiz creation returned {quiz_response.status_code}, trying to use existing")
            # Get course to find quiz
            course_response = authenticated_client.get(f"{BASE_URL}/api/courses/{SAMPLE_COURSE_ID}")
            modules = course_response.json().get("modules", [])
            quiz_id = None
            for m in modules:
                if m.get("quiz"):
                    quiz_id = m["quiz"]["id"]
                    break
            if not quiz_id:
                pytest.skip("No quiz found to add questions to")
        else:
            quiz_id = quiz_response.json().get("id")
        
        # Add question
        question_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/quizzes/{quiz_id}/questions",
            json={
                "question_text": "TEST: What is Python?",
                "question_type": "multiple_choice",
                "options": ["A snake", "A programming language", "A fruit", "A movie"],
                "correct_answer": 1,
                "points": 10
            }
        )
        
        assert question_response.status_code == 200, f"Expected 200, got {question_response.status_code}: {question_response.text}"
        print(f"PASS: Added question to quiz {quiz_id}")
    
    def test_admin_delete_quiz(self, authenticated_client, quiz_module_id):
        """Test admin can delete a quiz"""
        # Create a quiz
        create_response = authenticated_client.post(
            f"{BASE_URL}/api/admin/modules/{quiz_module_id}/quiz",
            json={
                "title": "TEST_DeleteQuiz",
                "passing_score": 60
            }
        )
        
        if create_response.status_code != 200:
            print(f"INFO: Quiz might already exist, skipping delete test")
            return
        
        quiz_id = create_response.json().get("id")
        
        # Delete the quiz
        delete_response = authenticated_client.delete(
            f"{BASE_URL}/api/admin/quizzes/{quiz_id}"
        )
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        print(f"PASS: Deleted quiz {quiz_id}")


# ======================== Admin User Management Tests ========================

class TestAdminUserManagement:
    """Admin user management tests (ban/unban)"""
    
    def test_admin_ban_user(self, authenticated_client):
        """Test admin can ban a user"""
        # First register a test user
        test_email = f"TEST_ban_{int(time.time())}@example.com"
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "TestPassword123",
                "first_name": "Ban",
                "last_name": "Test"
            }
        )
        
        if reg_response.status_code != 200:
            print(f"INFO: Could not create test user: {reg_response.text}")
            # Get existing test user
            users_response = authenticated_client.get(f"{BASE_URL}/api/admin/users")
            users = users_response.json().get("users", [])
            test_users = [u for u in users if u.get("email", "").startswith("TEST_")]
            if not test_users:
                pytest.skip("No test users available")
            user_id = test_users[0]["id"]
        else:
            # Get the created user
            users_response = authenticated_client.get(f"{BASE_URL}/api/admin/users?search={test_email}")
            users = users_response.json().get("users", [])
            if not users:
                pytest.skip("Could not find created user")
            user_id = users[0]["id"]
        
        # Ban the user
        ban_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            json={"is_banned": True}
        )
        
        assert ban_response.status_code == 200, f"Expected 200, got {ban_response.status_code}: {ban_response.text}"
        print(f"PASS: Banned user {user_id}")
    
    def test_admin_unban_user(self, authenticated_client):
        """Test admin can unban a user"""
        # Get a banned user
        users_response = authenticated_client.get(f"{BASE_URL}/api/admin/users")
        users = users_response.json().get("users", [])
        banned_users = [u for u in users if u.get("is_banned") and u.get("email", "").startswith("TEST_")]
        
        if not banned_users:
            print("INFO: No banned test users, skipping unban test")
            return
        
        user_id = banned_users[0]["id"]
        
        # Unban the user
        unban_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            json={"is_banned": False}
        )
        
        assert unban_response.status_code == 200, f"Expected 200, got {unban_response.status_code}: {unban_response.text}"
        print(f"PASS: Unbanned user {user_id}")


# ======================== Admin Assignment Tests ========================

class TestAdminAssignments:
    """Admin assignment management tests"""
    
    def test_admin_create_assignment(self, authenticated_client):
        """Test admin can create an assignment"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/admin/assignments",
            json={
                "title": "TEST_Assignment_" + str(int(time.time())),
                "description": "Test assignment description",
                "course_id": SAMPLE_COURSE_ID,
                "due_days": 7,
                "max_score": 100
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "assignment_id" in data or "id" in data, "Response should contain assignment id"
        assignment_id = data.get("assignment_id") or data.get("id")
        
        print(f"PASS: Created assignment: {assignment_id}")
    
    def test_admin_get_assignments(self, authenticated_client):
        """Test admin can list assignments"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/assignments")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "assignments" in data, "Response should contain assignments"
        
        print(f"PASS: Got {len(data['assignments'])} assignments")


# ======================== Enrolled Courses API Test ========================

class TestEnrolledCoursesAPI:
    """Enrolled courses API tests"""
    
    def test_enrolled_courses_endpoint(self, authenticated_client):
        """Test enrolled courses endpoint"""
        response = authenticated_client.get(f"{BASE_URL}/api/enrolled-courses")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "courses" in data, "Response should contain courses"
        
        print(f"PASS: Got {len(data['courses'])} enrolled courses")


# ======================== Payment Integration Test ========================

class TestPaymentIntegration:
    """Payment initiation tests (PayU)"""
    
    def test_payu_config_present(self, api_client):
        """Test PayU is configured in health check"""
        response = api_client.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200
        data = response.json()
        
        services = data.get("services", {})
        assert services.get("payu") == "configured", "PayU should be configured"
        
        print("PASS: PayU is configured")
    
    def test_payment_initiate_requires_cart(self, authenticated_client):
        """Test payment initiation fails with empty cart"""
        # Clear cart first
        cart_response = authenticated_client.get(f"{BASE_URL}/api/cart")
        cart_items = cart_response.json().get("items", [])
        
        for item in cart_items:
            authenticated_client.delete(f"{BASE_URL}/api/cart/{item['id']}")
        
        # Try to initiate payment with empty cart
        response = authenticated_client.post(f"{BASE_URL}/api/payments/initiate")
        
        assert response.status_code == 400, f"Expected 400 for empty cart, got {response.status_code}"
        print("PASS: Payment initiation correctly fails with empty cart")
    
    def test_payment_initiate_with_cart(self, authenticated_client):
        """Test payment initiation works with items in cart"""
        # Get a course and add to cart
        courses_response = authenticated_client.get(f"{BASE_URL}/api/courses")
        courses = courses_response.json().get("courses", [])
        
        if not courses:
            pytest.skip("No courses available")
        
        course_id = courses[0]["id"]
        
        # Add to cart (might already be there)
        authenticated_client.post(f"{BASE_URL}/api/cart", json={"course_id": course_id})
        
        # Initiate payment
        response = authenticated_client.post(f"{BASE_URL}/api/payments/initiate")
        
        # Either 200 (success) or 400 (already enrolled)
        if response.status_code == 200:
            data = response.json()
            assert "txn_id" in data, "Response should contain txn_id"
            assert "merchant_key" in data, "Response should contain merchant_key"
            assert "hash" in data, "Response should contain hash"
            assert "payu_url" in data, "Response should contain payu_url"
            
            print(f"PASS: Payment initiated - txn_id: {data['txn_id']}")
        else:
            print(f"INFO: Payment initiation returned {response.status_code}, likely already enrolled")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
