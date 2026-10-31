import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '../../components/layout/Container/Container';
import Header from '../../components/layout/Header/Header';
import Footer from '../../components/layout/Footer/Footer';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import { clearActiveUserSession, getActiveUserSession } from '../../data/authSession';
import './PlaceholderPage.css';

export default function PlaceholderPage({
  title,
  requiresAuth = false,
  currentUser,
  setCurrentUser,
  isSignInOpen,
  setIsSignInOpen,
  authMode,
  setAuthMode
}) {
  const navigate = useNavigate();
  const protectedPageLocked = requiresAuth && !currentUser;

  useEffect(() => {
    if (protectedPageLocked && !isSignInOpen) setIsSignInOpen(true);
  }, [protectedPageLocked, isSignInOpen, setIsSignInOpen]);

  const handleSignOut = () => {
    clearActiveUserSession();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsSignInOpen(false);
  };

  const handleCloseSignIn = () => {
    setIsSignInOpen(false);
    if (protectedPageLocked && !getActiveUserSession()) navigate('/');
  };

  return (
    <div className="placeholder-page">
      <Header
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenSignIn={() => { setAuthMode('signin'); setIsSignInOpen(true); }}
        onOpenRegister={() => { setAuthMode('register'); setIsSignInOpen(true); }}
      />

      {!protectedPageLocked && (
        <main className="placeholder-main" id="main-content">
          <Container size="md">
            <div className="placeholder-card">
              <h1 className="placeholder-title">{title}</h1>
              <p className="placeholder-subtitle">This page is coming soon.</p>
            </div>
          </Container>
        </main>
      )}

      {protectedPageLocked ? null : <Footer />}
      <SignInModal
        key={authMode}
        isOpen={isSignInOpen}
        onClose={handleCloseSignIn}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authMode}
      />
    </div>
  );
}
