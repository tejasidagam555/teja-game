/*
 * Project: Smart Dustbin with IoT Monitoring
 * Author: Teja Sidagam
 * Microcontroller: ESP32
 * Components:
 *   - ESP32 Development Board
 *   - HC-SR04 Ultrasonic Sensor (Lid Control & Waste Level Detection)
 *   - Servo Motor (SG90 or MG996R)
 *   - Wi-Fi & Web Interface / Blynk IoT / Serial Telemetry
 * 
 * Description:
 *   1. Automatic Lid Opening: Uses an ultrasonic sensor to detect a hand/object within proximity.
 *   2. Fill-Level Monitoring: Reads dustbin fill percentage using a second sensor or dual thresholding.
 *   3. IoT Dashboard: Hosts an onboard Web Server showing real-time lid status and dustbin fill level.
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>

// --- Wi-Fi Credentials ---
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// --- Pin Definitions ---
#define TRIG_PIN_HAND    5   // Ultrasonic Trig Pin for Hand Detection
#define ECHO_PIN_HAND   18   // Ultrasonic Echo Pin for Hand Detection
#define TRIG_PIN_LEVEL  19   // Ultrasonic Trig Pin for Waste Fill Level
#define ECHO_PIN_LEVEL  21   // Ultrasonic Echo Pin for Waste Fill Level
#define SERVO_PIN       13   // Servo Motor PWM Pin
#define BUZZER_PIN      12   // Optional Alert Buzzer Pin
#define LED_FULL_PIN    14   // Indicator LED for Dustbin Full

// --- Constants & Thresholds ---
const int HAND_DISTANCE_THRESHOLD_CM = 20;  // Open lid if hand is closer than 20 cm
const int DUSTBIN_DEPTH_CM           = 30;  // Height of empty dustbin in cm
const int CLOSE_DELAY_MS             = 4000;// Keep lid open for 4 seconds
const int SERVO_OPEN_ANGLE           = 90;  // Open position angle (degrees)
const int SERVO_CLOSE_ANGLE          = 0;   // Closed position angle (degrees)

// --- Objects ---
Servo lidServo;
WebServer server(80);

// --- Global Variables ---
bool isLidOpen = false;
unsigned long lidOpenTime = 0;
float wasteLevelPercent = 0.0;
float handDistanceCm = 100.0;

// --- Function Prototypes ---
float getDistanceCM(int trigPin, int echoPin);
void updateWasteLevel();
void handleLidLogic();
void handleRoot();
void handleStatus();

void setup() {
  Serial.begin(115200);
  delay(500);

  // Pin Configuration
  pinMode(TRIG_PIN_HAND, OUTPUT);
  pinMode(ECHO_PIN_HAND, INPUT);
  pinMode(TRIG_PIN_LEVEL, OUTPUT);
  pinMode(ECHO_PIN_LEVEL, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_FULL_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_FULL_PIN, LOW);

  // Attach Servo
  lidServo.attach(SERVO_PIN);
  lidServo.write(SERVO_CLOSE_ANGLE);

  // Connect to Wi-Fi
  Serial.println("\nConnecting to Wi-Fi...");
  WiFi.begin(ssid, password);

  int wifiRetries = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetries < 20) {
    delay(500);
    Serial.print(".");
    wifiRetries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi Connected successfully!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    // Setup Web Server Routes
    server.on("/", handleRoot);
    server.on("/status", handleStatus);
    server.begin();
    Serial.println("HTTP server started!");
  } else {
    Serial.println("\nWi-Fi connection failed. Running in standalone offline mode.");
  }

  Serial.println("Smart Dustbin System Initialized.");
}

void loop() {
  // Handle web server clients if Wi-Fi is connected
  if (WiFi.status() == WL_CONNECTED) {
    server.handleClient();
  }

  // Check proximity for hand detection
  handDistanceCm = getDistanceCM(TRIG_PIN_HAND, ECHO_PIN_HAND);

  // Measure waste fill level
  updateWasteLevel();

  // Control Lid open/close logic
  handleLidLogic();

  delay(100);
}

// Function to calculate distance in CM from Ultrasonic Sensor
float getDistanceCM(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
  if (duration == 0) return 999.0; // Return out of range if no pulse received

  float distance = duration * 0.0343 / 2.0;
  return distance;
}

// Update dustbin fill percentage based on height
void updateWasteLevel() {
  float distanceToWaste = getDistanceCM(TRIG_PIN_LEVEL, ECHO_PIN_LEVEL);

  if (distanceToWaste <= DUSTBIN_DEPTH_CM) {
    float filledHeight = DUSTBIN_DEPTH_CM - distanceToWaste;
    wasteLevelPercent = (filledHeight / DUSTBIN_DEPTH_CM) * 100.0;
    if (wasteLevelPercent < 0) wasteLevelPercent = 0;
    if (wasteLevelPercent > 100) wasteLevelPercent = 100;
  } else {
    wasteLevelPercent = 0.0;
  }

  // Alert LED & Buzzer if bin is more than 90% full
  if (wasteLevelPercent >= 90.0) {
    digitalWrite(LED_FULL_PIN, HIGH);
  } else {
    digitalWrite(LED_FULL_PIN, LOW);
  }
}

// Logic for opening and closing the lid automatically
void handleLidLogic() {
  // Trigger open if hand detected within threshold
  if (handDistanceCm > 0 && handDistanceCm <= HAND_DISTANCE_THRESHOLD_CM) {
    if (!isLidOpen) {
      Serial.println("[ACTION] Motion detected! Opening Lid.");
      lidServo.write(SERVO_OPEN_ANGLE);
      isLidOpen = true;
    }
    lidOpenTime = millis(); // Reset timer while hand remains present
  }

  // Auto-close lid after timeout
  if (isLidOpen && (millis() - lidOpenTime >= CLOSE_DELAY_MS)) {
    Serial.println("[ACTION] Timeout reached. Closing Lid.");
    lidServo.write(SERVO_CLOSE_ANGLE);
    isLidOpen = false;
  }
}

// Web Dashboard Interface
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>ESP32 Smart Dustbin</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<meta http-equiv='refresh' content='3'>"; // Auto-refresh every 3s
  html += "<style>body{font-family:Arial,sans-serif;background:#0f172a;color:#fff;text-align:center;padding:20px;}";
  html += ".card{background:#1e293b;padding:20px;margin:15px auto;max-width:400px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.3);}";
  html += ".bar-container{background:#334155;border-radius:10px;height:24px;overflow:hidden;margin-top:10px;}";
  html += ".bar{height:100%;background:#3b82f6;transition:width 0.5s;}";
  html += ".status{font-size:18px;font-weight:bold;margin-top:10px;}";
  html += ".open{color:#22c55e;} .closed{color:#ef4444;}";
  html += "</style></head><body>";
  html += "<h1>Smart Dustbin IoT Dashboard</h1>";
  html += "<p>Developer: <b>Teja Sidagam</b></p>";
  html += "<div class='card'><h2>Lid Status</h2>";
  html += "<div class='status " + String(isLidOpen ? "open" : "closed") + "'>" + String(isLidOpen ? "LID OPEN" : "LID CLOSED") + "</div></div>";
  html += "<div class='card'><h2>Fill Level</h2>";
  html += "<div style='font-size:32px;font-weight:bold;'>" + String(wasteLevelPercent, 1) + "%</div>";
  html += "<div class='bar-container'><div class='bar' style='width:" + String(wasteLevelPercent, 1) + "%;'></div></div></div>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

// JSON Endpoint for IoT integration
void handleStatus() {
  String json = "{";
  json += "\"lid_open\":" + String(isLidOpen ? "true" : "false") + ",";
  json += "\"hand_distance_cm\":" + String(handDistanceCm, 1) + ",";
  json += "\"fill_level_percent\":" + String(wasteLevelPercent, 1);
  json += "}";
  server.send(200, "application/json", json);
}
