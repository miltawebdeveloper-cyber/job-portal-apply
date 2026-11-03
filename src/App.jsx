import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import ApplicationForm from './components/ApplicationForm.jsx';
import Footer from './components/Footer.jsx';
import ApplyPopup from './components/ApplyPopup.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <ApplicationForm />
      </main>
      <Footer />
      <ApplyPopup />
    </>
  );
}
