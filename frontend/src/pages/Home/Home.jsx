import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LightRays from '../../components/ui/LightRays';
import logo from '../../assets/logo.png';
import './Home.css';

const faqs = [
  {
    q: "What is Promet?",
    a: "Promet is an AI-powered tool that takes your vague, unstructured ideas and transforms them into highly optimized, context-rich prompts. It ensures you get the best possible results from any AI model."
  },
  {
    q: "Is it free to use?",
    a: "Yes, Promet offers a generous free tier that is perfect for everyday use. We also have premium plans for power users who need advanced models and unlimited generations."
  },
  {
    q: "Do I need to be a prompt engineer?",
    a: "Not at all. Promet is designed specifically so you don't have to be one. Just type your goal naturally, and we format it with the structure, tone, and constraints that AI models respond to best."
  },
  {
    q: "Is my data kept private?",
    a: "Absolutely. Your prompts are stored securely in your own private history. We do not use your personal prompt data to train our own foundation models."
  }
];

const FaqItem = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <article 
      className={`faq-card ${isOpen ? 'open' : ''}`} 
      onClick={() => setIsOpen(!isOpen)}
      style={{ 
        background: 'rgba(24, 24, 27, 0.4)', 
        border: '1px solid rgba(63, 63, 70, 0.5)', 
        borderRadius: '12px', 
        padding: '24px', 
        cursor: 'pointer',
        transition: 'background 0.2s ease, border-color 0.2s ease',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>{faq.q}</h3>
        <span style={{ fontSize: '24px', color: '#a1a1aa', fontWeight: 300, marginLeft: '16px', lineHeight: 1, display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
          {isOpen ? '−' : '+'}
        </span>
      </div>
      <div style={{
        maxHeight: isOpen ? '500px' : '0',
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <p style={{ fontSize: '15px', color: '#a1a1aa', lineHeight: 1.6, marginTop: '16px', marginBottom: 0, userSelect: 'text' }}>
          {faq.a}
        </p>
      </div>
    </article>
  );
};

const Home = () => {
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const reveals = document.querySelectorAll('.promet-home .reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    reveals.forEach((el) => observer.observe(el));

    const anchors = document.querySelectorAll('.promet-home a[href^="#"]');
    const anchorHandlers = [];
    anchors.forEach((anchor) => {
      const handler = (event) => {
        const id = anchor.getAttribute('href');
        if (!id || id.length <= 1) return;
        const target = document.querySelector(id);
        if (!target) return;

        event.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 84;
        window.scrollTo({ top: y, behavior: 'smooth' });
      };

      anchor.addEventListener('click', handler);
      anchorHandlers.push({ anchor, handler });
    });

    const tiltTargets = document.querySelectorAll('.promet-home .tilt-card');
    const tiltListeners = [];
    tiltTargets.forEach((card) => {
      let rect = null;

      const handleMove = (event) => {
        rect = rect || card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rx = (0.5 - y) * 4;
        const ry = (x - 0.5) * 6;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      };

      const reset = () => {
        rect = null;
        card.style.transform = '';
      };

      card.addEventListener('mousemove', handleMove);
      card.addEventListener('mouseleave', reset);
      card.addEventListener('blur', reset);

      tiltListeners.push({ card, handleMove, reset });
    });

    return () => {
      observer.disconnect();
      anchorHandlers.forEach(({ anchor, handler }) => anchor.removeEventListener('click', handler));
      tiltListeners.forEach(({ card, handleMove, reset }) => {
        card.removeEventListener('mousemove', handleMove);
        card.removeEventListener('mouseleave', reset);
        card.removeEventListener('blur', reset);
      });
    };
  }, []);

  return (
    <main className="promet-home">
      <div className="noise" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />

      <header className="site-header">
        <div className="container wide">
          <div className="nav-shell glass hairline">
            <div className="nav-inner">
              <a href="#" className="brand">
                <span className="brand-icon" aria-hidden="true">
                  <img src={logo} alt="Promet Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </span>
                <span className="brand-name">Promet</span>
              </a>

              <nav className="nav-links">
                <a href="#how" className="focus-ring">How it works</a>
                <a href="#modes" className="focus-ring">Modes</a>
                <a href="#about" className="focus-ring">About</a>
                <a href="#why" className="focus-ring">Why</a>
              </nav>

              <div className="nav-actions">
                <a href="https://github.com/Tripadh/Promet.git" target="_blank" rel="noreferrer" className="btn btn-outline focus-ring desktop-only">GitHub</a>
                <Link to="/login" className="btn btn-solid focus-ring">Try Promet</Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-rays-wrap" aria-hidden="true">
          <LightRays
            raysOrigin="top-center"
            raysColor="#ffffff"
            raysSpeed={1}
            lightSpread={0.5}
            rayLength={3}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0}
            distortion={0}
            className="custom-rays"
            pulsating={false}
            fadeDistance={1}
            saturation={1}
          />
        </div>
        <div className="container wide">
          <div className="hero-grid">
            <div className="hero-copy reveal">
              <div className="pill">
                <span className="pill-dot" />
                <span>From vague idea to precise prompt</span>
              </div>
              <h1>Turn Simple Ideas into Powerful AI Prompts</h1>
              <p>
                Promet transforms unclear or incomplete thoughts into optimized prompts for better AI results.
                Less guessing. More signal. Consistently sharper outputs.
              </p>

              <div id="try" className="hero-actions">
                <Link to="/login" className="btn btn-solid focus-ring">Try Promet</Link>
                <a href="https://github.com/Tripadh/Promet.git" target="_blank" rel="noreferrer" className="btn btn-outline focus-ring">View on GitHub</a>
              </div>

            </div>

            <div className="hero-visual reveal scanlines tilt-card">
              <div className="glow glow-1" />
              <div className="glow glow-2" />
              <div className="preview-shell">
                <div className="preview-titlebar">
                  <div className="traffic-dots"><span /><span /><span /></div>
                  <span className="label">Promet Preview</span>
                  <div className="tags"><span>Auto</span><span>Balanced</span></div>
                </div>
                <div className="preview-grid">
                  <div className="preview-pane">
                    <div className="pane-top"><span>Before</span><span>Input</span></div>
                    <div className="before-input">&ldquo;make me a landing page for a habit app&rdquo;</div>
                    <ul>
                      <li>Vague goal, no constraints, no audience.</li>
                      <li>Missing tone, style, sections.</li>
                    </ul>
                  </div>

                  <div className="preview-pane after-pane">
                    <div className="pane-top"><span>After</span><span>Optimized Prompt</span></div>
                    <div className="after-output">
                      Create a high-end landing page for a habit-tracking app targeting busy professionals. Use a
                      clean, minimal black and white aesthetic. Sections: hero with strong headline and CTA,
                      problem/solution, 3-step how it works, feature cards, open-source highlight, final CTA,
                      minimal footer. Tone: confident, concise, premium. Add subtle grain and high contrast.
                    </div>
                    <p className="after-note">Clear structure | Constraints | Style | Audience</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section split-border">
        <div className="ambient-glow" aria-hidden="true" />
        <div className="container narrow">
          <div className="center-copy reveal">
            <h2>What is Promet?</h2>
            <p>
              Promet converts rough ideas into clear, structured prompts. Better prompts mean better AI results every
              time. It is fast, precise, and designed for creators, engineers, and teams.
            </p>
          </div>

          <div className="feature-grid reveal">
            <article className="feature-card tilt-card"><h3>Clear intent</h3><p>Extracts goals, audience, constraints from vague inputs.</p></article>
            <article className="feature-card tilt-card"><h3>Structured output</h3><p>Delivers a precise prompt with sections and style.</p></article>
            <article className="feature-card tilt-card"><h3>Higher quality</h3><p>Consistent, reliable results across models.</p></article>
          </div>
        </div>
      </section>

      <section id="how" className="section split-border">
        <div className="ambient-glow" aria-hidden="true" />
        <div className="container wide">
          <div className="center-copy reveal">
            <h2>How it works</h2>
            <p>Three simple steps. No clutter.</p>
          </div>

          <div className="steps-grid reveal">
            <article className="step-card tilt-card"><span className="step-number">1</span><h3>Enter a simple idea</h3><p>Drop in an incomplete thought, sentence, or rough prompt.</p></article>
            <article className="step-card tilt-card"><span className="step-number">2</span><h3>Promet analyzes and restructures</h3><p>Understands intent, adds structure, constraints, and style.</p></article>
            <article className="step-card tilt-card"><span className="step-number">3</span><h3>Get an optimized prompt</h3><p>Copy, run, and get dramatically better outputs.</p></article>
          </div>
        </div>
      </section>

      <section id="modes" className="section split-border">
        <div className="ambient-glow" aria-hidden="true" />
        <div className="container wide">
          <div className="center-copy reveal">
            <h2>Prompt improvement modes</h2>
            <p>Choose the level of enhancement you need.</p>
          </div>

          <div className="modes-grid reveal">
            <article className="mode-card tilt-card"><h3>Quick Mode</h3><p>Short and clear prompt generation.</p></article>
            <article className="mode-card tilt-card"><h3>Auto Mode</h3><p>AI expands and enhances automatically.</p></article>
            <article className="mode-card tilt-card"><h3>Balanced Mode</h3><p>Structured and reliable, without heavy expansion.</p></article>
            <article className="mode-card tilt-card"><h3>Expert Mode</h3><p>Highly detailed prompts for complex tasks.</p></article>
          </div>
        </div>
      </section>

      <section id="why" className="section split-border">
        <div className="ambient-glow" aria-hidden="true" />
        <div className="container wide">
          <div className="why-grid reveal">
            <div>
              <h2>Why Promet</h2>
              <p>A sharp answer to a common problem: writing great prompts is hard.</p>
            </div>
            <div className="why-cards">
              <article className="mini-card tilt-card"><h3>The problem</h3><p>Most users struggle to write effective prompts. Results are inconsistent or vague.</p></article>
              <article className="mini-card tilt-card"><h3>The solution</h3><p>Promet improves prompt quality by structuring intent, constraints, audience, and style.</p></article>
              <article className="mini-card tilt-card"><h3>Consistency</h3><p>Repeatable quality across models and tasks.</p></article>
              <article className="mini-card tilt-card"><h3>Speed</h3><p>Less iteration, more building. Ship faster.</p></article>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="section split-border">
        <div className="ambient-glow" aria-hidden="true" />
        <div className="container narrow">
          <div className="center-copy reveal">
            <h2>Questions?</h2>
            <p>Here are the ones we get asked most.</p>
          </div>

          <div className="faq-grid reveal" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '40px' }}>
            {faqs.map((faq, idx) => (
              <FaqItem key={idx} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      <section id="opensource" className="section split-border section-bottom">
        <div className="container wide">
          <div className="oss-panel reveal">
            <div className="oss-grid">
              <div>
                <h2>Promet is open-source</h2>
                <p>Built in the open. Contributions, feedback, and ideas are welcome. Star the repo, file issues, or jump in with a PR.</p>
                <div className="oss-actions">
                  <a href="https://github.com/Tripadh/Promet.git" target="_blank" rel="noreferrer" className="btn btn-solid focus-ring">Star on GitHub</a>
                  <a href="https://github.com/Tripadh/Promet.git" target="_blank" rel="noreferrer" className="btn btn-outline focus-ring">Read the docs</a>
                </div>
              </div>
              <div className="stats-grid">
                <article className="stat-card"><h4>License</h4><p>MIT</p></article>
                <article className="stat-card"><h4>Contribute</h4><p>Issues and PRs welcome</p></article>
                <article className="stat-card"><h4>Stack</h4><p>Modern, minimal</p></article>
                <article className="stat-card"><h4>Quality</h4><p>Production-ready</p></article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container narrow center-text reveal">
          <h2>Stop guessing prompts. Start generating results.</h2>
          <p>Try Promet and feel the difference in one prompt.</p>
          <div className="cta-actions">
            <Link to="/login" className="btn btn-solid focus-ring">Try Promet</Link>
            <a href="https://github.com/Tripadh/Promet.git" target="_blank" rel="noreferrer" className="btn btn-outline focus-ring">View on GitHub</a>
          </div>
        </div>
      </section>

      <footer className="site-footer split-border">
        <div className="container wide">
          <div className="footer-top">
            <div className="footer-brand-block">
              <div className="footer-brand">
                <span className="brand-icon" aria-hidden="true">
                  <img src={logo} alt="Promet Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </span>
                <span className="brand-name">Promet</span>
              </div>
              <p className="footer-tagline">Turn rough ideas into precise AI prompts faster, cleaner, and more consistently.</p>
            </div>

            <div className="footer-columns">
              <div className="footer-col">
                <h4>Product</h4>
                <a href="#how" className="focus-ring">How it works</a>
                <a href="#modes" className="focus-ring">Modes</a>
                <a href="#about" className="focus-ring">About</a>
              </div>
              <div className="footer-col">
                <h4>Resources</h4>
                <a href="#why" className="focus-ring">Why Promet</a>
                <a href="https://github.com/Tripadh/Promet.git" target="_blank" rel="noreferrer" className="focus-ring">GitHub</a>
                <a href="https://github.com/Tripadh/Promet.git" target="_blank" rel="noreferrer" className="focus-ring">Documentation</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="copyright">© {currentYear} Promet.Open Source</p>
            <div className="footer-meta">
              <span>MIT License</span>
              <span className="meta-dot" aria-hidden="true" />
              <span>Built for creators and teams</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;
