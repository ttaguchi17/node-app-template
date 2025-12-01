import React, { useState } from "react";
import { Card, Button, Form, InputGroup, Spinner, Badge, Alert } from "react-bootstrap";
import { Sparkles, Send, Plus, MapPin, Utensils, Bed, Camera } from "lucide-react";
import { apiPost } from "../utils/api";

export default function AIAssistant({ tripLocation, onAddEvent }) {
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAsk = async (customQuery = null) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim()) return;

    setLoading(true);
    setError(null);
    setRecommendations([]); // Clear old results to show thinking state

    try {
      const data = await apiPost('/api/ai/ask', {
        tripLocation: tripLocation,
        userQuery: textToSend
      });

      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error(err);
      setError("The AI is taking a nap. Try again later.");
    } finally {
      setLoading(false);
      setQuery(""); // Clear input box
    }
  };

  // Helper to pick a cute icon based on category
  const getCategoryIcon = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("food") || t.includes("restaurant")) return <Utensils size={14} />;
    if (t.includes("hotel") || t.includes("stay")) return <Bed size={14} />;
    if (t.includes("sight") || t.includes("museum")) return <Camera size={14} />;
    return <MapPin size={14} />;
  };

  return (
    <Card className="shadow border-0 h-100" style={{ background: "#ffffff", borderRadius: '20px', border: '1px solid #e2e8f0' }}>
      <Card.Header className="border-0 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', borderRadius: '20px 20px 0 0' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-white bg-opacity-20 p-2 rounded-circle" style={{ backdropFilter: 'blur(10px)' }}>
            <Sparkles size={20} className="text-white" fill="currentColor" />
          </div>
          <div>
            <h5 className="m-0 fw-bold text-white">AI Trip Assistant</h5>
            <small className="text-white" style={{ opacity: 0.9 }}>Powered by Gemini 2.0</small>
          </div>
        </div>
      </Card.Header>

      <Card.Body className="d-flex flex-column pt-3" style={{ background: '#f8f9fc' }}>
        {/* Quick Chips (Fixed Suggestions) */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Button 
            variant="outline-primary"
            size="sm" 
            style={{ fontSize: '0.8rem', borderRadius: '20px', fontWeight: '600', border: '2px solid #e2e8f0', background: 'white' }}
            onClick={() => handleAsk("Top 3 restaurants for dinner")}
          >
            🍝 Dinner Spots
          </Button>
          <Button 
            variant="outline-primary"
            size="sm" 
            style={{ fontSize: '0.8rem', borderRadius: '20px', fontWeight: '600', border: '2px solid #e2e8f0', background: 'white' }}
            onClick={() => handleAsk("Must-see hidden gems")}
          >
            💎 Hidden Gems
          </Button>
          <Button 
            variant="outline-primary"
            size="sm" 
            style={{ fontSize: '0.8rem', borderRadius: '20px', fontWeight: '600', border: '2px solid #e2e8f0', background: 'white' }}
            onClick={() => handleAsk("Family friendly activities")}
          >
             👨‍👩‍👧‍👦 Activities
          </Button>
        </div>

        {/* Results Area */}
        <div className="overflow-auto mb-3 pe-1" style={{ height: '340px', background: 'white', borderRadius: '16px', padding: '1rem' }}>
          
          {/* Welcome Message if empty */}
          {!loading && recommendations.length === 0 && !error && (
            <div className="text-center mt-5">
              <div className="d-inline-flex p-4 rounded-circle mb-3" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
                <Sparkles size={40} className="text-white" />
              </div>
              <p className="fw-semibold mb-1" style={{ color: '#1e293b' }}>Ready to explore {tripLocation}?</p>
              <p className="text-muted small">Ask me anything or try a suggestion above!</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="fw-semibold" style={{ color: '#1e293b' }}>Discovering amazing places...</p>
              <p className="text-muted small">This won't take long</p>
            </div>
          )}

          {/* Error State */}
          {error && <Alert variant="danger" className="small py-2">{error}</Alert>}

          {/* Result Cards */}
          {recommendations.map((item, idx) => (
            <Card 
              key={idx} 
              className="mb-3 shadow-sm"
              style={{ 
                background: '#ffffff', 
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'default',
                border: '1px solid #e2e8f0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.15)';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div style={{ flex: 1 }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Badge 
                        style={{ 
                          fontSize: '0.7rem', 
                          padding: '5px 10px', 
                          borderRadius: '8px',
                          background: '#3b82f6',
                          color: 'white',
                          fontWeight: '600'
                        }}
                        className="d-flex align-items-center gap-1"
                      >
                        {getCategoryIcon(item.type)} {item.type}
                      </Badge>
                      <Badge 
                        style={{ 
                          fontSize: '0.7rem', 
                          padding: '5px 10px', 
                          borderRadius: '8px',
                          background: '#059669',
                          color: 'white',
                          fontWeight: '600'
                        }}
                      >
                        {item.cost}
                      </Badge>
                    </div>
                    <h6 className="fw-bold mb-2" style={{ fontSize: '0.95rem', color: '#1e293b' }}>{item.name}</h6>
                    <p className="text-muted mb-2" style={{ lineHeight: '1.5', fontSize: '0.8rem' }}>
                      {item.description}
                    </p>
                    <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
                      <MapPin size={12} /> <span>{item.location}</span>
                    </div>
                  </div>
                  
                  {/* The Magic "Add" Button */}
                  <Button 
                    className="rounded-circle border-0 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '42px', 
                      height: '42px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      padding: 0
                    }}
                    onClick={() => onAddEvent(item)}
                    title="Add to Itinerary"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15) rotate(90deg)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                    }}
                  >
                    <Plus size={22} strokeWidth={3} style={{ color: 'white' }} />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>

        {/* Chat Input */}
        <InputGroup style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0', background: 'white' }}>
          <Form.Control
            placeholder="Ask me anything about your trip..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
            className="border-0"
            style={{ 
              background: 'white',
              padding: '12px 16px',
              fontSize: '0.9rem',
              boxShadow: 'none'
            }}
          />
          <Button 
            className="border-0"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              padding: '0 20px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleAsk()}
            disabled={!query.trim() || loading}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Send size={18} />
          </Button>
        </InputGroup>
      </Card.Body>
    </Card>
  );
}