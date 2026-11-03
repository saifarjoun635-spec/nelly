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

# ========================= NEW TESTS FOR BOUTIQUE FEATURES =========================

def test_image_upload_with_token(token):
    """Test POST /api/admin/upload with token - upload a small 1x1 PNG"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a tiny 1x1 PNG base64 (valid PNG)
        # This is a minimal valid 1x1 transparent PNG
        tiny_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        data_url = f"data:image/png;base64,{tiny_png_base64}"
        
        payload = {"dataUrl": data_url}
        resp = requests.post(f"{BASE_URL}/admin/upload", json=payload, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            log_test("POST /api/admin/upload (with token)", False, f"Status {resp.status_code}: {resp.text}")
            return None
        
        data = resp.json()
        img_id = data.get("id")
        img_path = data.get("path")
        
        if not img_id or not img_path:
            log_test("POST /api/admin/upload (with token)", False, "Missing id or path in response")
            return None
        
        if not img_path.startswith("/api/images/"):
            log_test("POST /api/admin/upload (with token)", False, f"Path doesn't start with /api/images/: {img_path}")
            return None
        
        log_test("POST /api/admin/upload (with token)", True)
        return img_id
    except Exception as e:
        log_test("POST /api/admin/upload (with token)", False, str(e))
        return None

def test_image_upload_without_token():
    """Test POST /api/admin/upload without token returns 401"""
    try:
        tiny_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        data_url = f"data:image/png;base64,{tiny_png_base64}"
        
        payload = {"dataUrl": data_url}
        resp = requests.post(f"{BASE_URL}/admin/upload", json=payload, timeout=10)
        
        if resp.status_code != 401:
            log_test("POST /api/admin/upload (no token 401)", False, f"Expected 401, got {resp.status_code}")
            return
        
        log_test("POST /api/admin/upload (no token 401)", True)
    except Exception as e:
        log_test("POST /api/admin/upload (no token 401)", False, str(e))

def test_image_serving(img_id):
    """Test GET /api/images/{id} returns image with correct content-type"""
    if not img_id:
        log_test("GET /api/images/{id}", False, "No image ID available")
        return
    
    try:
        resp = requests.get(f"{BASE_URL}/images/{img_id}", timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/images/{id}", False, f"Status {resp.status_code}")
            return
        
        content_type = resp.headers.get("Content-Type", "")
        if not content_type.startswith("image/"):
            log_test("GET /api/images/{id}", False, f"Content-Type doesn't start with 'image/': {content_type}")
            return
        
        # Check that we got some binary data
        if len(resp.content) == 0:
            log_test("GET /api/images/{id}", False, "Empty image data")
            return
        
        log_test("GET /api/images/{id}", True)
    except Exception as e:
        log_test("GET /api/images/{id}", False, str(e))

def test_products_list():
    """Test GET /api/products returns 4 seeded products"""
    try:
        resp = requests.get(f"{BASE_URL}/products", timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/products", False, f"Status {resp.status_code}")
            return None
        
        products = resp.json()
        
        if not isinstance(products, list):
            log_test("GET /api/products", False, "Response is not a list")
            return None
        
        if len(products) < 4:
            log_test("GET /api/products", False, f"Expected at least 4 products, got {len(products)}")
            return None
        
        # Check for required seeded products
        product_names = [p.get("name", "") for p in products]
        required_products = [
            "Sérum Éclat Acide Hyaluronique",
            "Crème Nutritive Régénérante",
            "Coffret Soin Signature",
            "Fluide Protecteur SPF 50"
        ]
        
        for req_prod in required_products:
            if req_prod not in product_names:
                log_test("GET /api/products", False, f"Missing product: {req_prod}")
                return None
        
        # Check that each product has required fields
        for prod in products:
            if not all(key in prod for key in ["name", "price", "image", "category", "stock"]):
                log_test("GET /api/products", False, f"Product missing required fields: {prod.get('name', 'unknown')}")
                return None
        
        log_test("GET /api/products", True)
        return products
    except Exception as e:
        log_test("GET /api/products", False, str(e))
        return None

def test_create_product_with_token(token):
    """Test POST /api/admin/products with token"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        payload = {
            "name": "Masque Hydratant Test",
            "description": "Un masque hydratant pour les tests",
            "price": "65 $",
            "image": "/api/images/test-image",
            "category": "Soins visage",
            "stock": 15
        }
        
        resp = requests.post(f"{BASE_URL}/admin/products", json=payload, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            log_test("POST /api/admin/products (with token)", False, f"Status {resp.status_code}: {resp.text}")
            return None
        
        data = resp.json()
        product_id = data.get("id")
        
        if not product_id:
            log_test("POST /api/admin/products (with token)", False, "No product ID returned")
            return None
        
        log_test("POST /api/admin/products (with token)", True)
        return product_id
    except Exception as e:
        log_test("POST /api/admin/products (with token)", False, str(e))
        return None

def test_create_product_without_token():
    """Test POST /api/admin/products without token returns 401"""
    try:
        payload = {
            "name": "Test Product",
            "description": "Should fail",
            "price": "50 $",
            "image": "",
            "category": "Test",
            "stock": 10
        }
        
        resp = requests.post(f"{BASE_URL}/admin/products", json=payload, timeout=10)
        
        if resp.status_code != 401:
            log_test("POST /api/admin/products (no token 401)", False, f"Expected 401, got {resp.status_code}")
            return
        
        log_test("POST /api/admin/products (no token 401)", True)
    except Exception as e:
        log_test("POST /api/admin/products (no token 401)", False, str(e))

def test_update_product(token, product_id):
    """Test PUT /api/admin/products/{id} updates and persists"""
    if not product_id:
        log_test("PUT /api/admin/products/{id}", False, "No product ID available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Update stock to a new value
        payload = {
            "name": "Masque Hydratant Test Updated",
            "description": "Updated description",
            "price": "70 $",
            "image": "/api/images/test-image",
            "category": "Soins visage",
            "stock": 25
        }
        
        resp = requests.put(f"{BASE_URL}/admin/products/{product_id}", json=payload, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            log_test("PUT /api/admin/products/{id}", False, f"Status {resp.status_code}: {resp.text}")
            return
        
        # Verify the update persisted by fetching products
        resp2 = requests.get(f"{BASE_URL}/products", timeout=10)
        if resp2.status_code != 200:
            log_test("PUT /api/admin/products/{id} (verify persist)", False, "Failed to fetch products")
            return
        
        products = resp2.json()
        updated_product = next((p for p in products if p.get("id") == product_id), None)
        
        if not updated_product:
            log_test("PUT /api/admin/products/{id} (verify persist)", False, "Updated product not found")
            return
        
        if updated_product.get("stock") != 25:
            log_test("PUT /api/admin/products/{id} (verify persist)", False, f"Stock not updated: {updated_product.get('stock')}")
            return
        
        log_test("PUT /api/admin/products/{id}", True)
        log_test("PUT /api/admin/products/{id} (verify persist)", True)
    except Exception as e:
        log_test("PUT /api/admin/products/{id}", False, str(e))

def test_delete_product(token, product_id):
    """Test DELETE /api/admin/products/{id} removes product"""
    if not product_id:
        log_test("DELETE /api/admin/products/{id}", False, "No product ID available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        resp = requests.delete(f"{BASE_URL}/admin/products/{product_id}", headers=headers, timeout=10)
        
        if resp.status_code != 200:
            log_test("DELETE /api/admin/products/{id}", False, f"Status {resp.status_code}: {resp.text}")
            return
        
        # Verify the product is gone
        resp2 = requests.get(f"{BASE_URL}/products", timeout=10)
        if resp2.status_code != 200:
            log_test("DELETE /api/admin/products/{id} (verify removed)", False, "Failed to fetch products")
            return
        
        products = resp2.json()
        deleted_product = next((p for p in products if p.get("id") == product_id), None)
        
        if deleted_product:
            log_test("DELETE /api/admin/products/{id} (verify removed)", False, "Product still exists after delete")
            return
        
        log_test("DELETE /api/admin/products/{id}", True)
        log_test("DELETE /api/admin/products/{id} (verify removed)", True)
    except Exception as e:
        log_test("DELETE /api/admin/products/{id}", False, str(e))

def test_orders_and_stock_decrement(token):
    """Test POST /api/orders creates order and decrements stock"""
    try:
        # First, get the current products to find "Sérum Éclat Acide Hyaluronique"
        resp = requests.get(f"{BASE_URL}/products", timeout=10)
        if resp.status_code != 200:
            log_test("POST /api/orders (stock decrement)", False, "Failed to fetch products")
            return None
        
        products = resp.json()
        serum = next((p for p in products if p.get("name") == "Sérum Éclat Acide Hyaluronique"), None)
        
        if not serum:
            log_test("POST /api/orders (stock decrement)", False, "Sérum Éclat Acide Hyaluronique not found")
            return None
        
        serum_id = serum.get("id")
        initial_stock = serum.get("stock", 0)
        
        # Create an order with qty=2
        order_payload = {
            "items": [
                {
                    "productId": serum_id,
                    "name": "Sérum Éclat Acide Hyaluronique",
                    "price": "89 $",
                    "qty": 2
                }
            ],
            "total": "178 $",
            "firstName": "Amélie",
            "lastName": "Rousseau",
            "email": "amelie.rousseau@example.com",
            "phone": "514-555-7890",
            "address": "123 Rue Sainte-Catherine, Montréal",
            "note": "Livraison rapide svp"
        }
        
        resp2 = requests.post(f"{BASE_URL}/orders", json=order_payload, timeout=10)
        
        if resp2.status_code != 200:
            log_test("POST /api/orders (create)", False, f"Status {resp2.status_code}: {resp2.text}")
            return None
        
        order = resp2.json()
        order_id = order.get("id")
        
        if not order_id:
            log_test("POST /api/orders (create)", False, "No order ID returned")
            return None
        
        if order.get("status") != "nouvelle":
            log_test("POST /api/orders (create)", False, f"Status is {order.get('status')}, expected 'nouvelle'")
            return None
        
        log_test("POST /api/orders (create)", True)
        
        # Verify stock decreased by 2
        resp3 = requests.get(f"{BASE_URL}/products", timeout=10)
        if resp3.status_code != 200:
            log_test("POST /api/orders (stock decrement)", False, "Failed to fetch products after order")
            return order_id
        
        products_after = resp3.json()
        serum_after = next((p for p in products_after if p.get("id") == serum_id), None)
        
        if not serum_after:
            log_test("POST /api/orders (stock decrement)", False, "Serum not found after order")
            return order_id
        
        new_stock = serum_after.get("stock", 0)
        expected_stock = initial_stock - 2
        
        if new_stock != expected_stock:
            log_test("POST /api/orders (stock decrement)", False, f"Stock is {new_stock}, expected {expected_stock}")
            return order_id
        
        log_test("POST /api/orders (stock decrement)", True)
        return order_id
    except Exception as e:
        log_test("POST /api/orders", False, str(e))
        return None

def test_orders_empty_items():
    """Test POST /api/orders with empty items returns 400"""
    try:
        payload = {
            "items": [],
            "total": "0 $",
            "firstName": "Test",
            "lastName": "User",
            "email": "test@example.com",
            "phone": "514-555-0000"
        }
        
        resp = requests.post(f"{BASE_URL}/orders", json=payload, timeout=10)
        
        if resp.status_code != 400:
            log_test("POST /api/orders (empty items 400)", False, f"Expected 400, got {resp.status_code}")
            return
        
        log_test("POST /api/orders (empty items 400)", True)
    except Exception as e:
        log_test("POST /api/orders (empty items 400)", False, str(e))

def test_admin_orders_list_without_token():
    """Test GET /api/admin/orders without token returns 401"""
    try:
        resp = requests.get(f"{BASE_URL}/admin/orders", timeout=10)
        
        if resp.status_code != 401:
            log_test("GET /api/admin/orders (no token 401)", False, f"Expected 401, got {resp.status_code}")
            return
        
        log_test("GET /api/admin/orders (no token 401)", True)
    except Exception as e:
        log_test("GET /api/admin/orders (no token 401)", False, str(e))

def test_admin_orders_list_with_token(token, order_id):
    """Test GET /api/admin/orders with token lists orders (newest first)"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        resp = requests.get(f"{BASE_URL}/admin/orders", headers=headers, timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/admin/orders (with token)", False, f"Status {resp.status_code}: {resp.text}")
            return
        
        orders = resp.json()
        
        if not isinstance(orders, list):
            log_test("GET /api/admin/orders (with token)", False, "Response is not a list")
            return
        
        # Check that our order is in the list (should be first since newest)
        if order_id and len(orders) > 0:
            first_order = orders[0]
            if first_order.get("id") != order_id:
                log_test("GET /api/admin/orders (newest first)", False, f"Expected order {order_id} first, got {first_order.get('id')}")
                return
            log_test("GET /api/admin/orders (newest first)", True)
        
        log_test("GET /api/admin/orders (with token)", True)
    except Exception as e:
        log_test("GET /api/admin/orders (with token)", False, str(e))

def test_update_order(token, order_id):
    """Test PATCH /api/admin/orders/{id} updates status"""
    if not order_id:
        log_test("PATCH /api/admin/orders/{id}", False, "No order ID available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {"status": "traitée"}
        
        resp = requests.patch(f"{BASE_URL}/admin/orders/{order_id}", json=payload, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            log_test("PATCH /api/admin/orders/{id}", False, f"Status {resp.status_code}: {resp.text}")
            return
        
        data = resp.json()
        if not data.get("ok"):
            log_test("PATCH /api/admin/orders/{id}", False, "Response not ok")
            return
        
        log_test("PATCH /api/admin/orders/{id}", True)
    except Exception as e:
        log_test("PATCH /api/admin/orders/{id}", False, str(e))

def test_delete_order(token, order_id):
    """Test DELETE /api/admin/orders/{id}"""
    if not order_id:
        log_test("DELETE /api/admin/orders/{id}", False, "No order ID available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        resp = requests.delete(f"{BASE_URL}/admin/orders/{order_id}", headers=headers, timeout=10)
        
        if resp.status_code != 200:
            log_test("DELETE /api/admin/orders/{id}", False, f"Status {resp.status_code}: {resp.text}")
            return
        
        data = resp.json()
        if not data.get("ok"):
            log_test("DELETE /api/admin/orders/{id}", False, "Response not ok")
            return
        
        log_test("DELETE /api/admin/orders/{id}", True)
    except Exception as e:
        log_test("DELETE /api/admin/orders/{id}", False, str(e))

def test_change_credentials_wrong_password(token):
    """Test POST /api/admin/change-credentials with wrong currentPassword returns 401"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "currentPassword": "WrongPassword123",
            "newPassword": "NewPass123"
        }
        
        resp = requests.post(f"{BASE_URL}/admin/change-credentials", json=payload, headers=headers, timeout=10)
        
        if resp.status_code != 401:
            log_test("POST /api/admin/change-credentials (wrong password 401)", False, f"Expected 401, got {resp.status_code}")
            return
        
        log_test("POST /api/admin/change-credentials (wrong password 401)", True)
    except Exception as e:
        log_test("POST /api/admin/change-credentials (wrong password 401)", False, str(e))

def test_change_credentials_and_restore():
    """Test POST /api/admin/change-credentials changes password and can be restored"""
    try:
        # Step 1: Login with original credentials
        payload = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        resp = requests.post(f"{BASE_URL}/admin/login", json=payload, timeout=10)
        
        if resp.status_code != 200:
            log_test("POST /api/admin/change-credentials (change password)", False, "Failed to login with original credentials")
            return
        
        token1 = resp.json().get("token")
        
        # Step 2: Change password to TempPass123
        headers1 = {"Authorization": f"Bearer {token1}"}
        change_payload1 = {
            "currentPassword": ADMIN_PASSWORD,
            "newPassword": "TempPass123"
        }
        
        resp2 = requests.post(f"{BASE_URL}/admin/change-credentials", json=change_payload1, headers=headers1, timeout=10)
        
        if resp2.status_code != 200:
            log_test("POST /api/admin/change-credentials (change password)", False, f"Status {resp2.status_code}: {resp2.text}")
            return
        
        data2 = resp2.json()
        new_token = data2.get("token")
        new_email = data2.get("email")
        
        if not new_token or not new_email:
            log_test("POST /api/admin/change-credentials (change password)", False, "Missing token or email in response")
            return
        
        log_test("POST /api/admin/change-credentials (change password)", True)
        
        # Step 3: Verify login works with new password
        login_payload2 = {"email": ADMIN_EMAIL, "password": "TempPass123"}
        resp3 = requests.post(f"{BASE_URL}/admin/login", json=login_payload2, timeout=10)
        
        if resp3.status_code != 200:
            log_test("POST /api/admin/change-credentials (verify new password)", False, f"Failed to login with new password: {resp3.status_code}")
            # Try to restore anyway
            return
        
        token2 = resp3.json().get("token")
        log_test("POST /api/admin/change-credentials (verify new password)", True)
        
        # Step 4: Change password back to original
        headers2 = {"Authorization": f"Bearer {token2}"}
        change_payload2 = {
            "currentPassword": "TempPass123",
            "newPassword": ADMIN_PASSWORD
        }
        
        resp4 = requests.post(f"{BASE_URL}/admin/change-credentials", json=change_payload2, headers=headers2, timeout=10)
        
        if resp4.status_code != 200:
            log_test("POST /api/admin/change-credentials (restore password)", False, f"Status {resp4.status_code}: {resp4.text}")
            return
        
        log_test("POST /api/admin/change-credentials (restore password)", True)
        
        # Step 5: Verify login works with original password
        login_payload3 = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        resp5 = requests.post(f"{BASE_URL}/admin/login", json=login_payload3, timeout=10)
        
        if resp5.status_code != 200:
            log_test("POST /api/admin/change-credentials (verify restored)", False, f"Failed to login with restored password: {resp5.status_code}")
            return
        
        log_test("POST /api/admin/change-credentials (verify restored)", True)
    except Exception as e:
        log_test("POST /api/admin/change-credentials", False, str(e))

def main():
    print("=" * 80)
    print("CLINIQUE NELLY GLAM - BACKEND API TESTS (BOUTIQUE FEATURES)")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin: {ADMIN_EMAIL}")
    print("=" * 80)
    print()
    
    # Get admin token first
    print("🔐 Testing Admin Authentication...")
    token = test_admin_login()
    
    if not token:
        print("⚠️  Cannot proceed without admin token")
        sys.exit(1)
    
    # Test Image Upload & Serving
    print("\n🖼️  Testing Image Upload & Serving...")
    test_image_upload_without_token()
    img_id = test_image_upload_with_token(token)
    test_image_serving(img_id)
    
    # Test Products CRUD
    print("\n📦 Testing Products CRUD...")
    products = test_products_list()
    test_create_product_without_token()
    product_id = test_create_product_with_token(token)
    test_update_product(token, product_id)
    test_delete_product(token, product_id)
    
    # Test Orders & Stock Decrement
    print("\n🛒 Testing Orders & Stock Decrement...")
    test_orders_empty_items()
    order_id = test_orders_and_stock_decrement(token)
    test_admin_orders_list_without_token()
    test_admin_orders_list_with_token(token, order_id)
    test_update_order(token, order_id)
    test_delete_order(token, order_id)
    
    # Test Admin Change Credentials
    print("\n🔑 Testing Admin Change Credentials...")
    test_change_credentials_wrong_password(token)
    test_change_credentials_and_restore()
    
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
