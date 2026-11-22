# Example Docker Service Implementation
# Language: Python + Flask
# This is a reference implementation for the backend service

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os
from typing import List, Dict, Any
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# In-memory storage (replace with database in production)
chat_requests: Dict[str, Any] = {}
responses: Dict[str, Any] = {}

@app.route('/api/chat-requests/pending', methods=['GET'])
def get_pending_requests():
    """Get all pending chat requests"""
    pending = [
        req for req in chat_requests.values() 
        if req['status'] == 'pending'
    ]
    return jsonify(pending)

@app.route('/api/notifications/send', methods=['POST'])
def send_notification():
    """Send notification to mobile device"""
    data = request.json
    logger.info(f"Notification sent for request {data.get('requestId')}")
    
    # In production, integrate with notification service:
    # - Firebase Cloud Messaging
    # - AWS SNS
    # - Custom WebSocket push
    # - Or store in database to be pulled by mobile client
    
    return jsonify({'status': 'sent'}), 200

@app.route('/api/chat-requests/respond', methods=['POST'])
def respond_to_request():
    """Submit approval or rejection"""
    data = request.json
    request_id = data.get('requestId')
    
    responses[request_id] = {
        'requestId': request_id,
        'approved': data.get('approved'),
        'responseTime': data.get('responseTime'),
        'responderId': data.get('responderId'),
        'responderNote': data.get('responderNote', ''),
        'timestamp': datetime.now().isoformat()
    }
    
    # Update request status
    if request_id in chat_requests:
        chat_requests[request_id]['status'] = 'approved' if data.get('approved') else 'rejected'
    
    logger.info(f"Response received for request {request_id}: {data.get('approved')}")
    return jsonify({'status': 'recorded'}), 200

@app.route('/api/chat-requests/<request_id>/status', methods=['GET'])
def get_request_status(request_id):
    """Get current status of a request"""
    if request_id in responses:
        return jsonify(responses[request_id])
    elif request_id in chat_requests:
        return jsonify(chat_requests[request_id])
    return jsonify({'error': 'Not found'}), 404

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
```

## Running the Service

### Docker Setup
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8080
CMD ["python", "app.py"]
```

### requirements.txt
```
Flask==2.3.0
flask-cors==4.0.0
```

### Start Service
```bash
docker build -t kodezon-remote-chat-backend .
docker run -p 8080:8080 -e PORT=8080 kodezon-remote-chat-backend
```

## Production Considerations

1. **Database**: Use PostgreSQL/MongoDB instead of in-memory storage
2. **Authentication**: Add API key or OAuth2 authentication
3. **Notifications**: Integrate with Firebase, AWS SNS, or WebSocket server
4. **Logging**: Use structured logging with ELK stack or similar
5. **Monitoring**: Add Prometheus metrics and health checks
6. **Rate Limiting**: Add rate limiting per workspace/device
7. **Request Timeout**: Implement auto-rejection after timeout period
8. **Encryption**: Use HTTPS/WSS for all communications

## Testing

```bash
# Test pending requests
curl http://localhost:8080/api/chat-requests/pending

# Send test notification
curl -X POST http://localhost:8080/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "test-123",
    "workspaceName": "Test Project",
    "workspacePath": "/home/user/test",
    "workspaceId": "workspace-123",
    "question": "Should I proceed?",
    "timestamp": 1700000000000,
    "actionUrl": "http://localhost:3000/notifications/test-123"
  }'

# Submit response
curl -X POST http://localhost:8080/api/chat-requests/respond \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "test-123",
    "approved": true,
    "responseTime": 5000,
    "responderId": "device-123"
  }'
```
