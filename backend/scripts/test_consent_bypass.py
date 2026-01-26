import requests
import json

def test_consent_bypass():
    url = "http://localhost:8000/triage"
    payload = {"input": "I have chest pain"}
    headers = {
        "Content-Type": "application/json",
        "x-session-token": "MOCK_UNCONSENTED_TOKEN" # We would need a real session ID for a user with hasConsented=False
    }
    
    print("Testing Consent Bypass (Adversarial Test)...")
    try:
        # Note: This requires the backend to be running
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 403:
            print("PASS: Access denied (403) for unconsented user.")
            print(f"Error Detail: {response.json()}")
        elif response.status_code == 200:
            print("FAIL: Access granted for unconsented user! SECURITY HOLE.")
        else:
            print(f"INFO: Unexpected status code {response.status_code}")
    except Exception as e:
        print(f"INFO: Backend not reachable (expected if not running). Error: {e}")

if __name__ == "__main__":
    test_consent_bypass()
