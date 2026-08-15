#!/usr/bin/env python3
"""
Backend API tests for Clinique Nelly Glam
Tests all public and admin endpoints with realistic data
"""
import requests
import json
from datetime import datetime, timedelta
import sys

# Base URL from frontend/.env
BASE_URL = "https://beauty-clinic-app-10.preview.emergentagent.com/api"

# Admin credentials
ADMIN_EMAIL = "clinique@nellyglam.com"
ADMIN_PASSWORD = "NellyGlam2025!"

# Test results tracking
tests_passed = 0
tests_failed = 0
failures = []

def log_test(name, passed, details=""):
    global tests_passed, tests_failed, failures
    if passed:
        tests_passed += 1
        print(f"✅ {name}")
    else:
        tests_failed += 1
        failures.append(f"{name}: {details}")
        print(f"❌ {name}")
        if details:
            print(f"   Details: {details}")

def test_public_content():
    """Test GET /api/content returns seeded data"""
    try:
        resp = requests.get(f"{BASE_URL}/content", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/content", False, f"Status {resp.status_code}")
            return
        
        data = resp.json()
        # Check for key fields
        if not data.get("brandName"):
            log_test("GET /api/content", False, "Missing brandName")
            return
        if not data.get("hero"):
            log_test("GET /api/content", False, "Missing hero section")
            return
        if not data.get("contact"):
            log_test("GET /api/content", False, "Missing contact section")
            return
        
        log_test("GET /api/content", True)
    except Exception as e:
        log_test("GET /api/content", False, str(e))

def test_public_services():
    """Test GET /api/services returns seeded data with required categories"""
    try:
        resp = requests.get(f"{BASE_URL}/services", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/services", False, f"Status {resp.status_code}")
            return
        
        categories = resp.json()
        if not isinstance(categories, list) or len(categories) == 0:
            log_test("GET /api/services", False, "Empty or invalid categories")
            return
        
        # Check for required categories
        category_titles = [cat.get("title", "") for cat in categories]
        required_categories = [
            "Injections esthétiques",
            "Régénération cutanée",
            "Soins et exfoliation",
            "Laser et IPL"
        ]
        
        for req_cat in required_categories:
            if req_cat not in category_titles:
                log_test("GET /api/services", False, f"Missing category: {req_cat}")
                return
        
        # Check for specific services
        all_services = []
        for cat in categories:
            all_services.extend(cat.get("services", []))
        
        service_names = [s.get("name", "") for s in all_services]
        required_services = [
            "Toxines Botuliques",
            "Skin Booster",
            "PRP / PRF",
            "Épilation définitive"
        ]
        
        for req_svc in required_services:
            if req_svc not in service_names:
                log_test("GET /api/services", False, f"Missing service: {req_svc}")
                return
        
        # Check that "Épilation définitive" has priceTable
        epilation = next((s for s in all_services if s.get("name") == "Épilation définitive"), None)
        if not epilation or not epilation.get("priceTable"):
            log_test("GET /api/services", False, "Épilation définitive missing priceTable")
            return
        
        log_test("GET /api/services", True)
    except Exception as e:
        log_test("GET /api/services", False, str(e))

def test_public_hours():
    """Test GET /api/hours returns seeded data"""
    try:
        resp = requests.get(f"{BASE_URL}/hours", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/hours", False, f"Status {resp.status_code}")
            return
        
        hours = resp.json()
        if not isinstance(hours, dict) or len(hours) == 0:
            log_test("GET /api/hours", False, "Empty or invalid hours")
            return
        
        # Check for all weekdays
        weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        for day in weekdays:
            if day not in hours:
                log_test("GET /api/hours", False, f"Missing day: {day}")
                return
        
        log_test("GET /api/hours", True)
    except Exception as e:
        log_test("GET /api/hours", False, str(e))

def test_availability():
    """Test GET /api/availability returns 30-min slots between 10:00 and 20:00"""
    try:
        # Use a future date (e.g., 2025-08-20)
        test_date = "2025-08-20"
        resp = requests.get(f"{BASE_URL}/availability", params={"date": test_date}, timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/availability", False, f"Status {resp.status_code}")
            return None
        
        data = resp.json()
        if data.get("date") != test_date:
            log_test("GET /api/availability", False, "Date mismatch")
            return None
        
        slots = data.get("slots", [])
        if len(slots) == 0:
            log_test("GET /api/availability", False, "No slots returned")
            return None
        
        # Check that slots are 30-min intervals between 10:00 and 20:00
        # Expected: 10:00, 10:30, 11:00, ..., 19:30 (20 slots total)
        if "10:00" not in slots:
            log_test("GET /api/availability", False, "Missing 10:00 slot")
            return None
        
        if "19:30" not in slots:
            log_test("GET /api/availability", False, "Missing 19:30 slot")
            return None
        
        # Check 30-min intervals
        expected_slots = []
        for hour in range(10, 20):
            expected_slots.append(f"{hour:02d}:00")
            expected_slots.append(f"{hour:02d}:30")
        
        if len(slots) != len(expected_slots):
            log_test("GET /api/availability", False, f"Expected {len(expected_slots)} slots, got {len(slots)}")
            return None
        
        log_test("GET /api/availability", True)
        return test_date, slots[0]  # Return date and first available slot for next test
    except Exception as e:
        log_test("GET /api/availability", False, str(e))
        return None

def test_create_appointment(test_date, test_time):
    """Test POST /api/appointments creates appointment and removes slot from availability"""
    try:
        # Create appointment with realistic French data
        payload = {
            "service": "Toxines Botuliques",
            "date": test_date,
            "time": test_time,
            "firstName": "Sophie",
            "lastName": "Dubois",
            "email": "sophie.dubois@example.com",
            "phone": "514-555-1234",
            "note": "Première consultation"
        }
        
        resp = requests.post(f"{BASE_URL}/appointments", json=payload, timeout=10)
        if resp.status_code != 200:
            log_test("POST /api/appointments (create)", False, f"Status {resp.status_code}: {resp.text}")
            return None
        
        appt = resp.json()
        if not appt.get("id"):
            log_test("POST /api/appointments (create)", False, "No appointment ID returned")
            return None
        
        if appt.get("status") != "pending":
            log_test("POST /api/appointments (create)", False, f"Status is {appt.get('status')}, expected 'pending'")
            return None
        
        log_test("POST /api/appointments (create)", True)
        
        # Now check that the slot is no longer available
        resp2 = requests.get(f"{BASE_URL}/availability", params={"date": test_date}, timeout=10)
        if resp2.status_code != 200:
            log_test("POST /api/appointments (slot removed)", False, f"Status {resp2.status_code}")
            return appt.get("id")
        
        data2 = resp2.json()
        slots2 = data2.get("slots", [])
        
        if test_time in slots2:
            log_test("POST /api/appointments (slot removed)", False, f"Slot {test_time} still available after booking")
            return appt.get("id")
        
        log_test("POST /api/appointments (slot removed)", True)
        return appt.get("id")
    except Exception as e:
        log_test("POST /api/appointments (create)", False, str(e))
        return None

def test_double_booking(test_date, test_time):
    """Test POST /api/appointments with same date/time returns 409"""
    try:
        payload = {
            "service": "Skin Booster",
            "date": test_date,
            "time": test_time,
            "firstName": "Marie",
            "lastName": "Tremblay",
            "email": "marie.tremblay@example.com",
            "phone": "438-555-5678",
            "note": ""
        }
        
        resp = requests.post(f"{BASE_URL}/appointments", json=payload, timeout=10)
        if resp.status_code != 409:
            log_test("POST /api/appointments (double-book 409)", False, f"Expected 409, got {resp.status_code}")
            return
        
        log_test("POST /api/appointments (double-book 409)", True)
    except Exception as e:
        log_test("POST /api/appointments (double-book 409)", False, str(e))

def test_invalid_time_booking(test_date):
    """Test POST /api/appointments with invalid/unavailable time returns 409"""
    try:
        # Use a time outside business hours
        payload = {
            "service": "HydraFacial",
            "date": test_date,
            "time": "22:00",  # Outside 10:00-20:00
            "firstName": "Isabelle",
            "lastName": "Gagnon",
            "email": "isabelle.gagnon@example.com",
            "phone": "514-555-9999",
            "note": ""
        }
        
        resp = requests.post(f"{BASE_URL}/appointments", json=payload, timeout=10)
        if resp.status_code != 409:
            log_test("POST /api/appointments (invalid time 409)", False, f"Expected 409, got {resp.status_code}")
            return
        
        log_test("POST /api/appointments (invalid time 409)", True)
    except Exception as e:
        log_test("POST /api/appointments (invalid time 409)", False, str(e))

def test_admin_login():
    """Test POST /api/admin/login with correct and wrong credentials"""
    try:
        # Test correct credentials
        payload = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        resp = requests.post(f"{BASE_URL}/admin/login", json=payload, timeout=10)
        
        if resp.status_code != 200:
            log_test("POST /api/admin/login (correct creds)", False, f"Status {resp.status_code}: {resp.text}")
            return None
        
        data = resp.json()
        token = data.get("token")
        if not token:
            log_test("POST /api/admin/login (correct creds)", False, "No token returned")
            return None
        
        log_test("POST /api/admin/login (correct creds)", True)
        
        # Test wrong password
        payload2 = {"email": ADMIN_EMAIL, "password": "WrongPassword123"}
        resp2 = requests.post(f"{BASE_URL}/admin/login", json=payload2, timeout=10)
        
        if resp2.status_code != 401:
            log_test("POST /api/admin/login (wrong password 401)", False, f"Expected 401, got {resp2.status_code}")
            return token
        
        log_test("POST /api/admin/login (wrong password 401)", True)
        return token
    except Exception as e:
        log_test("POST /api/admin/login", False, str(e))
        return None

def test_protected_endpoints(token):
    """Test that protected endpoints require token"""
    try:
        # Test without token
        resp = requests.get(f"{BASE_URL}/admin/appointments", timeout=10)
        if resp.status_code != 401:
            log_test("GET /api/admin/appointments (no token 401)", False, f"Expected 401, got {resp.status_code}")
            return
        
        log_test("GET /api/admin/appointments (no token 401)", True)
        
        # Test with token
        headers = {"Authorization": f"Bearer {token}"}
        resp2 = requests.get(f"{BASE_URL}/admin/appointments", headers=headers, timeout=10)
        if resp2.status_code != 200:
            log_test("GET /api/admin/appointments (with token)", False, f"Status {resp2.status_code}")
            return
        
        appointments = resp2.json()
        if not isinstance(appointments, list):
            log_test("GET /api/admin/appointments (with token)", False, "Response is not a list")
            return
        
        log_test("GET /api/admin/appointments (with token)", True)
    except Exception as e:
        log_test("GET /api/admin/appointments", False, str(e))

def test_update_appointment(token, appt_id):
    """Test PATCH /api/admin/appointments/{id}"""
    if not appt_id:
        log_test("PATCH /api/admin/appointments/{id}", False, "No appointment ID available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {"status": "confirmed"}
        
        resp = requests.patch(f"{BASE_URL}/admin/appointments/{appt_id}", json=payload, headers=headers, timeout=10)
        if resp.status_code != 200:
            log_test("PATCH /api/admin/appointments/{id}", False, f"Status {resp.status_code}: {resp.text}")
            return
        
        data = resp.json()
        if not data.get("ok"):
            log_test("PATCH /api/admin/appointments/{id}", False, "Response not ok")
            return
        
        log_test("PATCH /api/admin/appointments/{id}", True)
    except Exception as e:
        log_test("PATCH /api/admin/appointments/{id}", False, str(e))

def test_delete_appointment(token, appt_id):
    """Test DELETE /api/admin/appointments/{id}"""
    if not appt_id:
        log_test("DELETE /api/admin/appointments/{id}", False, "No appointment ID available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        resp = requests.delete(f"{BASE_URL}/admin/appointments/{appt_id}", headers=headers, timeout=10)
        if resp.status_code != 200:
            log_test("DELETE /api/admin/appointments/{id}", False, f"Status {resp.status_code}: {resp.text}")
            return
        
        data = resp.json()
        if not data.get("ok"):
            log_test("DELETE /api/admin/appointments/{id}", False, "Response not ok")
            return
        
        log_test("DELETE /api/admin/appointments/{id}", True)
    except Exception as e:
        log_test("DELETE /api/admin/appointments/{id}", False, str(e))

def test_update_hours(token):
    """Test PUT /api/admin/hours - set sunday to closed, verify availability empty, restore"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get current hours first
        resp = requests.get(f"{BASE_URL}/hours", timeout=10)
        if resp.status_code != 200:
            log_test("PUT /api/admin/hours", False, "Failed to get current hours")
            return
        
        original_hours = resp.json()
        
        # Set sunday to closed
        modified_hours = dict(original_hours)
        modified_hours["sunday"] = {"open": False, "start": "10:00", "end": "20:00"}
        
        payload = {"hours": modified_hours}
        resp2 = requests.put(f"{BASE_URL}/admin/hours", json=payload, headers=headers, timeout=10)
        if resp2.status_code != 200:
            log_test("PUT /api/admin/hours (set sunday closed)", False, f"Status {resp2.status_code}: {resp2.text}")
            return
        
        log_test("PUT /api/admin/hours (set sunday closed)", True)
        
        # Get availability for a Sunday (2025-08-24 is a Sunday)
        sunday_date = "2025-08-24"
        resp3 = requests.get(f"{BASE_URL}/availability", params={"date": sunday_date}, timeout=10)
        if resp3.status_code != 200:
            log_test("PUT /api/admin/hours (sunday availability empty)", False, f"Status {resp3.status_code}")
            # Restore hours before returning
            requests.put(f"{BASE_URL}/admin/hours", json={"hours": original_hours}, headers=headers, timeout=10)
            return
        
        data3 = resp3.json()
        slots = data3.get("slots", [])
        if len(slots) != 0:
            log_test("PUT /api/admin/hours (sunday availability empty)", False, f"Expected 0 slots, got {len(slots)}")
            # Restore hours before returning
            requests.put(f"{BASE_URL}/admin/hours", json={"hours": original_hours}, headers=headers, timeout=10)
            return
        
        log_test("PUT /api/admin/hours (sunday availability empty)", True)
        
        # Restore original hours
        resp4 = requests.put(f"{BASE_URL}/admin/hours", json={"hours": original_hours}, headers=headers, timeout=10)
        if resp4.status_code != 200:
            log_test("PUT /api/admin/hours (restore)", False, f"Status {resp4.status_code}")
            return
        
        log_test("PUT /api/admin/hours (restore)", True)
    except Exception as e:
        log_test("PUT /api/admin/hours", False, str(e))

def test_blocked_dates(token):
    """Test PUT /api/admin/blocked-dates - block a date, verify availability empty"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Block a specific future date
        blocked_date = "2025-09-15"
        payload = {"dates": [blocked_date]}
        
        resp = requests.put(f"{BASE_URL}/admin/blocked-dates", json=payload, headers=headers, timeout=10)
        if resp.status_code != 200:
            log_test("PUT /api/admin/blocked-dates", False, f"Status {resp.status_code}: {resp.text}")
            return
        
        log_test("PUT /api/admin/blocked-dates", True)
        
        # Get availability for the blocked date
        resp2 = requests.get(f"{BASE_URL}/availability", params={"date": blocked_date}, timeout=10)
        if resp2.status_code != 200:
            log_test("PUT /api/admin/blocked-dates (availability empty)", False, f"Status {resp2.status_code}")
            return
        
        data2 = resp2.json()
        slots = data2.get("slots", [])
        if len(slots) != 0:
            log_test("PUT /api/admin/blocked-dates (availability empty)", False, f"Expected 0 slots, got {len(slots)}")
            return
        
        log_test("PUT /api/admin/blocked-dates (availability empty)", True)
        
        # Clear blocked dates
        resp3 = requests.put(f"{BASE_URL}/admin/blocked-dates", json={"dates": []}, headers=headers, timeout=10)
        if resp3.status_code != 200:
            log_test("PUT /api/admin/blocked-dates (clear)", False, f"Status {resp3.status_code}")
            return
        
        log_test("PUT /api/admin/blocked-dates (clear)", True)
    except Exception as e:
        log_test("PUT /api/admin/blocked-dates", False, str(e))

def test_update_content(token):
    """Test PUT /api/admin/content accepts current payload shape"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get current content
        resp = requests.get(f"{BASE_URL}/content", timeout=10)
        if resp.status_code != 200:
            log_test("PUT /api/admin/content", False, "Failed to get current content")
            return
        
        current_content = resp.json()
        
        # Update with same structure (just modify brandName slightly)
        modified_content = dict(current_content)
        modified_content["brandName"] = "Nelly Glam"  # Keep same
        
        payload = {"data": modified_content}
        resp2 = requests.put(f"{BASE_URL}/admin/content", json=payload, headers=headers, timeout=10)
        if resp2.status_code != 200:
            log_test("PUT /api/admin/content", False, f"Status {resp2.status_code}: {resp2.text}")
            return
        
        data = resp2.json()
        if not data.get("ok"):
            log_test("PUT /api/admin/content", False, "Response not ok")
            return
        
        log_test("PUT /api/admin/content", True)
    except Exception as e:
        log_test("PUT /api/admin/content", False, str(e))

def test_update_services(token):
    """Test PUT /api/admin/services accepts current payload shape"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get current services
        resp = requests.get(f"{BASE_URL}/services", timeout=10)
        if resp.status_code != 200:
            log_test("PUT /api/admin/services", False, "Failed to get current services")
            return
        
        current_services = resp.json()
        
        # Update with same structure
        payload = {"categories": current_services}
        resp2 = requests.put(f"{BASE_URL}/admin/services", json=payload, headers=headers, timeout=10)
        if resp2.status_code != 200:
            log_test("PUT /api/admin/services", False, f"Status {resp2.status_code}: {resp2.text}")
            return
        
        data = resp2.json()
        if not data.get("ok"):
            log_test("PUT /api/admin/services", False, "Response not ok")
            return
        
        log_test("PUT /api/admin/services", True)
    except Exception as e:
        log_test("PUT /api/admin/services", False, str(e))

def main():
    print("=" * 80)
    print("CLINIQUE NELLY GLAM - BACKEND API TESTS")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin: {ADMIN_EMAIL}")
    print("=" * 80)
    print()
    
    # Run all tests in order
    print("📋 Testing Public Endpoints...")
    test_public_content()
    test_public_services()
    test_public_hours()
    
    print("\n📅 Testing Availability & Appointments...")
    availability_result = test_availability()
    
    if availability_result:
        test_date, test_time = availability_result
        appt_id = test_create_appointment(test_date, test_time)
        test_double_booking(test_date, test_time)
        test_invalid_time_booking(test_date)
    else:
        print("⚠️  Skipping appointment tests due to availability test failure")
        appt_id = None
    
    print("\n🔐 Testing Admin Authentication...")
    token = test_admin_login()
    
    if token:
        print("\n🛡️  Testing Protected Endpoints...")
        test_protected_endpoints(token)
        
        print("\n✏️  Testing Admin Appointment Management...")
        test_update_appointment(token, appt_id)
        test_delete_appointment(token, appt_id)
        
        print("\n⚙️  Testing Admin CMS Updates...")
        test_update_hours(token)
        test_blocked_dates(token)
        test_update_content(token)
        test_update_services(token)
    else:
        print("⚠️  Skipping admin tests due to login failure")
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"✅ Passed: {tests_passed}")
    print(f"❌ Failed: {tests_failed}")
    print(f"📊 Total: {tests_passed + tests_failed}")
    
    if failures:
        print("\n❌ FAILURES:")
        for failure in failures:
            print(f"  - {failure}")
    
    print("=" * 80)
    
    # Exit with appropriate code
    sys.exit(0 if tests_failed == 0 else 1)

if __name__ == "__main__":
    main()
