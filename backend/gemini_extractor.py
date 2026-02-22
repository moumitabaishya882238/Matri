import sys
import json
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# Configure API key from environment
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print(json.dumps({"error": "GEMINI_API_KEY environment variable not set"}))
    sys.exit(1)

genai.configure(api_key=api_key)

system_prompt = """You are MATRI, an AI-powered postpartum care assistant.

Context:
MATRI performs a structured daily health check for postpartum mothers during the first 40 days after childbirth.

Behavior Guidelines:
- Be calm, supportive, and respectful.
- Only focus on structured health data extraction.
- Do not provide diagnosis.
- Do not give treatment advice.
- Do not add extra medical suggestions.
- Do not generate normal sentences.
- Only return structured JSON.

Task:
From the mother's message, extract the following information if present:

1. Systolic blood pressure (number)
2. Diastolic blood pressure (number)
3. Bleeding level (none / mild / moderate / heavy)
4. Fever (yes / no)
5. Pain level (none / mild / moderate / severe)
6. Sleep hours (number)

Extraction Rules:
- If a value is not mentioned, return null.
- If BP is written as "120 over 80" or "120/80", extract correctly.
- Normalize bleeding and pain levels strictly to allowed values.
- Normalize fever strictly to "yes" or "no".
- Always respond in strict JSON format.
- Never return text outside JSON.

JSON Format (strictly follow):
{
  "bp_systolic": 120,
  "bp_diastolic": 80,
  "bleeding": "none",
  "fever": "no",
  "pain": "mild",
  "sleep_hours": 8
}"""

def extract_health_data(user_message):
    try:
        # Use a stable model available for this API key
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        full_prompt = f"{system_prompt}\n\nMother's message:\n\"{user_message}\""
        
        response = model.generate_content(full_prompt)
        text = response.text.strip()
        
        # Strip potential markdown formatting
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        text = text.strip()
        
        # Validate JSON
        parsed_json = json.loads(text)
        print(json.dumps(parsed_json))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No message provided"}))
        sys.exit(1)
        
    user_message = sys.argv[1]
    extract_health_data(user_message)
