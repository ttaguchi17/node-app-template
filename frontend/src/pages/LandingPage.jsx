import React from 'react';
import { Container, Navbar, Nav, Button, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const handleCtaClick = () => {
    navigate(isLoggedIn ? '/dashboard' : '/login');
  };

  return (
    <div className="landing-page font-sans">
      {/* === 1. Navigation === */}
      <Navbar expand="lg" fixed="top" className="glass-nav py-3">
        <Container>
          <Navbar.Brand href="#" className="fw-bold d-flex align-items-center gap-2">
            <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
              <span style={{ fontSize: '1.25rem' }}>✈️</span> 
            </div>
            <span className="text-gray-900 fw-bolder" style={{ letterSpacing: '-0.5px', fontSize: '1.25rem'}}>TripApp</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 shadow-none" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center gap-3">
              <Nav.Link href="#about" className="fw-semibold text-secondary">Mission</Nav.Link>
              <Nav.Link href="#features" className="fw-semibold text-secondary">Features</Nav.Link>
              <Nav.Link href="#how-it-works" className="fw-semibold text-secondary">How it Works</Nav.Link>
              
              {isLoggedIn ? (
                 <Button variant="primary" className="px-4 py-2 rounded-pill shadow-sm fw-bold" onClick={() => navigate('/dashboard')}>
                   Dashboard
                 </Button>
              ) : (
                <>
                  <Nav.Link onClick={() => navigate('/login')} className="fw-bold text-primary">Log In</Nav.Link>
                  <Button variant="primary" className="px-4 py-2 rounded-pill shadow-sm fw-bold" onClick={() => navigate('/login')}>
                    Sign Up Free
                  </Button>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* === 2. Hero Section === */}
      <header id="home" className="landing-hero position-relative d-flex align-items-center" style={{ minHeight: '100vh', paddingTop: '80px' }}>
        <Container className="position-relative" style={{ zIndex: 2 }}>
          <Row className="align-items-center">
            <Col lg={6} className="text-center text-lg-start mb-5 mb-lg-0">
              <span className="badge bg-white text-primary bg-opacity-25 backdrop-blur mb-3 px-3 py-2 rounded-pill fw-bold border border-white border-opacity-25">
                🚀 The #1 Travel Planner
              </span>
              <h1 className="display-3 fw-black mb-4 text-white lh-sm">
                Plan the chaos out of your <span className="text-warning">next trip.</span>
              </h1>
              <p className="lead mb-5 text-white opacity-75 fs-5 fw-light" style={{ maxWidth: '500px', margin: '0 auto 0 0' }}>
                Automatically sync emails, invite friends to collaborate, and map out your entire journey in one beautiful dashboard.
              </p>
              <div className="d-flex justify-content-center justify-content-lg-start gap-3">
                <Button className="btn-light-custom btn-lg px-5 py-3 rounded-pill fw-bold" onClick={handleCtaClick}>
                  {isLoggedIn ? 'Go to Dashboard' : 'Start Planning'}
                </Button>
                <Button variant="outline-light" size="lg" className="px-4 py-3 rounded-pill fw-bold backdrop-blur" href="#how-it-works">
                  How it Works
                </Button>
              </div>
            </Col>
            
            {/* Hero Visual / Mockup */}
            <Col lg={6}>
              <div className="hero-floating-img p-4">
                {/* Fake UI to represent Dashboard */}
                <div className="bg-white rounded-4 p-3 shadow-sm mb-3 opacity-75">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-primary rounded-circle p-2 text-white">✈️</div>
                    <div>
                      <h6 className="m-0 fw-bold text-dark">Flight to Tokyo</h6>
                      <small className="text-muted">Oct 24 • JL 005</small>
                    </div>
                    <div className="ms-auto fw-bold text-success">$840</div>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                     <div className="progress-bar w-75 bg-primary"></div>
                  </div>
                </div>
                
                <div className="bg-white rounded-4 p-3 shadow-sm opacity-50" style={{ transform: 'scale(0.95)' }}>
                   <div className="d-flex align-items-center gap-3">
                    <div className="bg-warning rounded-circle p-2 text-white">🏨</div>
                    <div>
                      <h6 className="m-0 fw-bold text-dark">Shinjuku Granbell</h6>
                      <small className="text-muted">4 Nights • Confirmed</small>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </header>

      {/* === 3. About / Mission Section === */}
      <section id="about" className="py-5 bg-white">
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col md={8}>
              <h6 className="text-primary fw-bold text-uppercase tracking-wider mb-3">Our Mission</h6>
              <h2 className="display-6 fw-bold text-dark mb-4">
                "We built TripApp because spreadsheets are <span className="text-decoration-line-through text-muted">boring</span> hard."
              </h2>
              <p className="text-muted fs-5 lh-lg">
                TripApp was built to solve the headache of group travel. 
                No more lost confirmation numbers, no more "what time is dinner?", and definitely no more complicated Excel sheets. 
                Just you, your friends, and the open road.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* === 4. Features Section === */}
      <section id="features" className="py-5 bg-light">
        <Container className="py-5">
          <div className="text-center mb-5">
            <h2 className="section-title display-5">Everything you need</h2>
            <p className="text-muted fs-5">Powerful features to organize your journey.</p>
          </div>
          
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm card-hover-effect" style={{ borderRadius: '24px' }}>
                <Card.Body className="p-4 p-lg-5 text-center">
                  <div className="feature-icon mb-4">📧</div>
                  <h3 className="h4 fw-bold mb-3 text-gray-900">Gmail Sync</h3>
                  <p className="text-muted">
                    Stop digging through your inbox. We automatically scan emails to find bookings and add them to your timeline instantly.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm card-hover-effect" style={{ borderRadius: '24px' }}>
                <Card.Body className="p-4 p-lg-5 text-center">
                  <div className="feature-icon mb-4">👯</div>
                  <h3 className="h4 fw-bold mb-3 text-gray-900">Collaborative</h3>
                  <p className="text-muted">
                    Invite friends to your trip. Assign roles, manage budgets together, and keep everyone on the same page in real-time.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm card-hover-effect" style={{ borderRadius: '24px' }}>
                <Card.Body className="p-4 p-lg-5 text-center">
                  <div className="feature-icon mb-4">🗺️</div>
                  <h3 className="h4 fw-bold mb-3 text-gray-900">Live Maps</h3>
                  <p className="text-muted">
                    Visualize your journey. See all your events, hotels, and flights plotted instantly on a beautiful interactive map.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* === 5. How It Works ("Something Else") === */}
      <section id="how-it-works" className="py-5 bg-white">
        <Container className="py-5">
           <Row className="align-items-center mb-5">
             <Col lg={6}>
               <h2 className="display-5 fw-bold text-dark">From Chaos to <br/><span className="text-primary">Clarity</span> in 3 Steps.</h2>
             </Col>
             <Col lg={6} className="text-lg-end">
               <p className="lead text-muted">You focus on the experience. <br/>We handle the logistics.</p>
             </Col>
           </Row>

           <Row className="g-4">
             {/* Step 1 */}
             <Col md={4}>
               <div className="step-card">
                 <span className="step-number">1</span>
                 <h4 className="fw-bold mt-4 mb-3">Connect</h4>
                 <p className="text-muted">Sign in with Google and let us securely scan your travel emails for flights and hotels.</p>
               </div>
             </Col>
             {/* Step 2 */}
             <Col md={4}>
               <div className="step-card">
                 <span className="step-number">2</span>
                 <h4 className="fw-bold mt-4 mb-3">Customize</h4>
                 <p className="text-muted">Drag and drop events on your timeline. Invite friends to vote on activities.</p>
               </div>
             </Col>
             {/* Step 3 */}
             <Col md={4}>
               <div className="step-card">
                 <span className="step-number">3</span>
                 <h4 className="fw-bold mt-4 mb-3">Explore</h4>
                 <p className="text-muted">Open the app on your phone and follow the map. Enjoy your stress-free trip!</p>
               </div>
             </Col>
           </Row>
        </Container>
      </section>

      {/* === 6. CTA Register Section === */}
      <section className="cta-section py-5 text-center text-white">
        <Container className="py-5 position-relative" style={{ zIndex: 1 }}>
          <Row className="justify-content-center">
            <Col md={8}>
              <h2 className="display-4 fw-bold mb-4">Ready to take off?</h2>
              <p className="lead mb-5 opacity-90">
                Join thousands of travelers who are planning their next adventure the smart way.
              </p>
              <Button size="lg" className="btn-light-custom px-5 py-3 rounded-pill fw-bold shadow-lg" onClick={() => navigate('/login')}>
                Start Planning Free
              </Button>
              <p className="mt-3 small opacity-75">No credit card required</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* === 7. Footer === */}
      <footer className="py-4 bg-white border-top">
        <Container>
          <Row className="align-items-center">
            <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
              <span className="fw-bold text-primary">TripApp</span>
              <small className="ms-3 text-muted">&copy; {new Date().getFullYear()} All rights reserved.</small>
            </Col>
            <Col md={6} className="text-center text-md-end">
              <Nav className="justify-content-center justify-content-md-end">
                <Nav.Link href="#" className="text-muted py-0 small">Privacy</Nav.Link>
                <Nav.Link href="#" className="text-muted py-0 small">Terms</Nav.Link>
                <Nav.Link href="#" className="text-muted py-0 small">Support</Nav.Link>
              </Nav>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}