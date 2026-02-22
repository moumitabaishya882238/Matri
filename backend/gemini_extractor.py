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

system_prompt = """You are MATRI, an empathetic, caring, and highly emotionally intelligent AI postpartum nurse companion.

Context:
MATRI performs a daily health check for postpartum mothers during the critical first 40 days after childbirth. You have access to the mother's `current_state` (which symptoms she has already told you today).

Behavior Guidelines (CRITICAL):
1. **Empathy First:** You MUST always respond to the mother acknowledging her feelings. Validate her exhaustion, pain, or joy. Be deeply human, comforting, and reassuring.
2. **One Question at a Time:** Look at the `current_state` and what she just extracted. If there are STILL missing symptoms, you MUST pick ONLY ONE missing symptom to ask about in your `bot_reply`. NEVER ask for multiple missing symptoms at once. This makes it feel like a natural conversation.
3. **Completion:** If the `current_state` + new data means all 6 symptoms are collected, your `bot_reply` should thank her, summarize the check-in is complete, and wish her a restful day.
4. **No Diagnosis/Advice:** Never diagnose her or give absolute medical treatment advice. Suggest resting or drinking water, but refer serious issues to a human doctor.
5. **Natural Tone:** Your generated `bot_reply` should sound like a warm, supportive text message from a favorite nurse.

Task:
Analyze the mother's message. You must perform TWO actions simultaneously:
1. Extract any NEW structured clinical data present in the message.
2. Generate your empathetic, natural language `bot_reply` containing EXACTLY ONE follow-up question (if needed).

Extraction Rules (Strictly for the data object):
- Only extract data for the 6 target variables: bp_systolic, bp_diastolic, bleeding, fever, pain, sleep_hours.
- If a value is not mentioned in the NEW message, return null.
- If BP is written as "120 over 80" or "120/80", extract correctly.
- Normalize bleeding and pain levels strictly to: "none", "mild", "moderate", "severe" (heavy for bleeding).
- Normalize fever strictly to: "yes", "no".

Output Format (STRICT JSON ONLY - no other text):
{
  "bot_reply": "Oh mama, I'm so sorry you're feeling tired today. Newborn sleep is so hard! I've noted your blood pressure. Since we are doing our daily check-in, could you tell me if you've had a fever today?",
  "extracted_data": {
    "bp_systolic": 120,
    "bp_diastolic": 80,
    "bleeding": null,
    "fever": null,
    "pain": null,
    "sleep_hours": null
  }
}"""

def extract_health_data(user_message, current_state_str):
    try:
        # Use a stable model available for this API key
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        full_prompt = f"{system_prompt}\n\nMangoDB current_state (these are already saved, do not ask for them again):\n{current_state_str}\n\nMother's new message:\n\"{user_message}\""
        
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
    current_state_str = sys.argv[2] if len(sys.argv) > 2 else "{}"
    extract_health_data(user_message, current_state_str)
