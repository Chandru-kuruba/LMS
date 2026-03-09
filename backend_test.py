#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class LMSAPITester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = {
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_details': []
        }
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.test_results['total_tests'] += 1
        if success:
            self.test_results['passed_tests'] += 1
            status = "✅ PASS"
        else:
            self.test_results['failed_tests'] += 1
            status = "❌ FAIL"
        
        result = {
            'test': test_name,
            'status': 'PASS' if success else 'FAIL',
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        
        if response_data:
            result['response_data'] = response_data
        
        self.test_results['test_details'].append(result)
        print(f"{status} - {test_name}: {details}")
        return success
    
    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def test_health_check(self) -> bool:
        """Test the health endpoint"""
        response = self.make_request('GET', '/api/health')
        
        if not response:
            return self.log_test("Health Check", False, "No response received")
        
        if response.status_code == 200:
            try:
                data = response.json()
                status = data.get('status')
                services = data.get('services', {})
                
                details = f"Status: {status}, Services: {list(services.keys())}"
                return self.log_test("Health Check", True, details, data)
            except json.JSONDecodeError:
                return self.log_test("Health Check", False, f"Invalid JSON response: {response.text}")
        else:
            return self.log_test("Health Check", False, f"Status {response.status_code}: {response.text}")
    
    def test_admin_login(self) -> bool:
        """Test admin login with default credentials"""
        login_data = {
            "email": "admin@lumina.com",
            "password": "admin123"
        }
        
        response = self.make_request('POST', '/api/auth/login', json=login_data)
        
        if not response:
            return self.log_test("Admin Login", False, "No response received")
        
        if response.status_code == 200:
            try:
                data = response.json()
                access_token = data.get('access_token')
                user_data = data.get('user', {})
                user_role = user_data.get('role')
                
                if access_token and user_role == 'admin':
                    self.admin_token = access_token
                    self.session.headers.update({'Authorization': f'Bearer {access_token}'})
                    details = f"Admin login successful, role: {user_role}"
                    return self.log_test("Admin Login", True, details)
                else:
                    return self.log_test("Admin Login", False, "Missing token or incorrect role")
            except json.JSONDecodeError:
                return self.log_test("Admin Login", False, f"Invalid JSON response: {response.text}")
        else:
            error_msg = response.text
            if response.status_code == 403:
                details = f"Status 403 - Admin account may need email verification: {error_msg}"
            else:
                details = f"Status {response.status_code}: {error_msg}"
            return self.log_test("Admin Login", False, details)
    
    def test_courses_list(self) -> bool:
        """Test courses listing endpoint"""
        response = self.make_request('GET', '/api/courses')
        
        if not response:
            return self.log_test("Courses List", False, "No response received")
        
        if response.status_code == 200:
            try:
                data = response.json()
                courses = data.get('courses', [])
                total = data.get('total', 0)
                
                details = f"Retrieved {len(courses)} courses, total: {total}"
                return self.log_test("Courses List", True, details, {'course_count': len(courses), 'total': total})
            except json.JSONDecodeError:
                return self.log_test("Courses List", False, f"Invalid JSON response: {response.text}")
        else:
            return self.log_test("Courses List", False, f"Status {response.status_code}: {response.text}")
    
    def test_categories_endpoint(self) -> bool:
        """Test categories listing endpoint"""
        response = self.make_request('GET', '/api/courses/categories')
        
        if not response:
            return self.log_test("Categories List", False, "No response received")
        
        if response.status_code == 200:
            try:
                data = response.json()
                categories = data.get('categories', [])
                
                details = f"Retrieved {len(categories)} categories: {categories[:5]}"  # Show first 5
                return self.log_test("Categories List", True, details, {'categories': categories})
            except json.JSONDecodeError:
                return self.log_test("Categories List", False, f"Invalid JSON response: {response.text}")
        else:
            return self.log_test("Categories List", False, f"Status {response.status_code}: {response.text}")
    
    def test_user_registration(self) -> bool:
        """Test user registration endpoint"""
        registration_data = {
            "email": f"testuser_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        response = self.make_request('POST', '/api/auth/register', json=registration_data)
        
        if not response:
            return self.log_test("User Registration", False, "No response received")
        
        if response.status_code == 200:
            try:
                data = response.json()
                message = data.get('message', '')
                email = data.get('email', '')
                
                if 'verify' in message.lower() or 'otp' in message.lower():
                    details = f"Registration successful with OTP verification required for {email}"
                    return self.log_test("User Registration", True, details)
                else:
                    details = f"Registration successful: {message}"
                    return self.log_test("User Registration", True, details)
            except json.JSONDecodeError:
                return self.log_test("User Registration", False, f"Invalid JSON response: {response.text}")
        else:
            return self.log_test("User Registration", False, f"Status {response.status_code}: {response.text}")
    
    def test_auth_me_endpoint(self) -> bool:
        """Test authenticated user profile endpoint"""
        if not self.admin_token:
            return self.log_test("Auth Me Endpoint", False, "No auth token available")
        
        response = self.make_request('GET', '/api/auth/me')
        
        if not response:
            return self.log_test("Auth Me Endpoint", False, "No response received")
        
        if response.status_code == 200:
            try:
                data = response.json()
                email = data.get('email', '')
                role = data.get('role', '')
                
                details = f"User profile retrieved: {email}, role: {role}"
                return self.log_test("Auth Me Endpoint", True, details)
            except json.JSONDecodeError:
                return self.log_test("Auth Me Endpoint", False, f"Invalid JSON response: {response.text}")
        else:
            return self.log_test("Auth Me Endpoint", False, f"Status {response.status_code}: {response.text}")
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all API tests"""
        print("🚀 Starting LMS Backend API Tests")
        print("=" * 50)
        
        # Core API tests
        self.test_health_check()
        self.test_admin_login()
        self.test_courses_list()
        self.test_categories_endpoint()
        self.test_user_registration()
        
        # Authenticated tests (if admin login worked)
        if self.admin_token:
            self.test_auth_me_endpoint()
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print(f"Total Tests: {self.test_results['total_tests']}")
        print(f"✅ Passed: {self.test_results['passed_tests']}")
        print(f"❌ Failed: {self.test_results['failed_tests']}")
        
        if self.test_results['total_tests'] > 0:
            success_rate = (self.test_results['passed_tests'] / self.test_results['total_tests']) * 100
            print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.test_results

def main():
    """Main test execution"""
    backend_url = "https://94b169de-1401-427e-8f51-eba599d0e975.preview.emergentagent.com"
    
    tester = LMSAPITester(backend_url)
    results = tester.run_all_tests()
    
    # Return exit code based on test results
    if results['failed_tests'] > 0:
        print(f"\n⚠️  Some tests failed. Check the details above.")
        return 1
    else:
        print(f"\n🎉 All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())