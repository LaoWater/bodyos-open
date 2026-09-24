import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { FormScoreRing } from '@/components/charts/FormScoreRing';
import { BodyBlueprint } from '@/components/charts/BodyBlueprint';
import { useAppModeStore } from '@/stores/appModeStore';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Eye, Brain, TrendingUp, Download, Scan, Video, MessageCircle, CheckCircle2, Zap, Shield, ChevronDown, Activity, Dumbbell, BarChart3, Heart, ExternalLink, Menu, X } from 'lucide-react';
import { AnalysisOrbit } from '@/components/features/AnalysisOrbit';

// ─── Data ────────────────────────────────────────────────────

const SOURCE = 'https://github.com/LaoWater/bodyos-open';
const features = [
  {pillar:'SEE', icon:<Eye className="w-7 h-7"/>, title:'Movement, made visible.', description:'Native iOS camera work meets on-device MediaPipe pose detection. Follow 33 landmarks through a movement and explore geometric form cues.', color:'#5B7CFA', gradient:'from-accent-primary to-accent-primary/40', details:['Swift camera integration and React Native screens','Landmark coordinates and skeleton drawing','Joint-angle and movement analysis source','Your starting point for exercise-specific feedback']},
  {pillar:'LEARN', icon:<Brain className="w-7 h-7"/>, title:'A workspace around the person.', description:'A web interface for sessions, body checkpoints and workout planning, with a sample workspace you can explore immediately.', color:'#4ECDC4', gradient:'from-accent-secondary to-accent-secondary/40', details:['Session and checkpoint interfaces','Demo and real data adapters','Supabase account and data schema','Product design you can make your own']},
  {pillar:'GROW', icon:<TrendingUp className="w-7 h-7"/>, title:'Go further with the source.', description:'The research lives beside the product: extraction, labeling, model training and export code, plus an optional AI coaching function.', color:'#D4A574', gradient:'from-brand-amber to-brand-amber/40', details:['Python and TensorFlow research pipeline','Landmark normalization and phase labels','Custom model architecture and export notebooks','Setup and customization guides for your next step']},
];
const howItWorks = [
 {step:'01',title:'Explore',description:'Open the sample web workspace. See the screens and interactions before setting anything up.',icon:<Scan className="w-6 h-6"/>},
 {step:'02',title:'Choose your part',description:'Start with the web, mobile, data or vision source. Each has its own guide.',icon:<Video className="w-6 h-6"/>},
 {step:'03',title:'Make it yours',description:'Change your branding and one useful workflow, by hand or with your coding assistant.',icon:<MessageCircle className="w-6 h-6"/>},
 {step:'04',title:'Give something back',description:'Share a fix, a clearer guide or an idea from your practice. Contributions are welcome.',icon:<TrendingUp className="w-6 h-6"/>},
];
const metrics = [
 {value:'Web',label:'React workspace',icon:<BarChart3 className="w-5 h-5"/>},
 {value:'Mobile',label:'React Native + Swift',icon:<Activity className="w-5 h-5"/>},
 {value:'33',label:'MediaPipe landmarks',icon:<Scan className="w-5 h-5"/>},
 {value:'ML',label:'Python research source',icon:<Brain className="w-5 h-5"/>},
];
const faqs = [
 {q:'Is BodyOS free to use?',a:'The source is free under the BodyOS Community License. You can customize it for yourself, your gym and your paying coaching clients. Hosting and optional AI providers have their own costs.'},
 {q:'Can I sell my version?',a:'You may charge for fitness or coaching services and for customization work. Selling the software itself, white-label licenses or a competing hosted software platform requires separate permission. The repository contains the full terms.'},
 {q:'Do I need to be a developer?',a:'You can explore the web demo without an account. The repository includes a beginner route, an agent brief and customization examples. Native mobile builds and backend setup still need development tools; an assistant can guide you through them.'},
 {q:'What is included?',a:'Web and mobile source, native iOS pose detection, database scripts, an optional coaching function and ML research. The short release-scope note in the repository identifies demo data and integration work. A trained custom correction model and an App Store download are not included.'},
 {q:'How can I help?',a:'Open an issue or a pull request on GitHub. A clearer instruction, an accessibility fix or feedback from training practice is a good first contribution.'},
];

// ─── Component ───────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();
  const setMode = useAppModeStore((s) => s.setMode);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleDemo = () => {
    setMode('demo');
    navigate('/app/home');
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary overflow-x-hidden">

      {/* ═══════════════════ STICKY NAV ═══════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between relative">
          <img
            src="/media/logo2-square-transparent.png"
            alt="BodyOS"
            className="h-14 opacity-90 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />

          {/* Desktop nav — absolutely centered */}
          <div className="hidden md:flex items-center gap-8 absolute left-[calc(50%-25px)] -translate-x-1/2">
            {['Features', 'How It Works', 'Community', 'FAQ', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => item === 'Contact' ? navigate('/contact') : scrollTo(item.toLowerCase().replace(/\s+/g, '-'))}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 mr-[-16px]">
            <ThemeToggle size="sm" />
            <Button variant="ghost" size="sm" onClick={handleDemo}>
              Try Demo
            </Button>
            <Button size="sm" onClick={() => window.open(SOURCE, '_blank', 'noopener,noreferrer')}>
              Get the code
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-secondary"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-bg-secondary border-b border-border-subtle px-4 py-4 space-y-3"
          >
            {['Features', 'How It Works', 'Community', 'FAQ', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() =>
                  item === 'Contact'
                    ? navigate('/contact')
                    : scrollTo(item.toLowerCase().replace(/\s+/g, '-'))
                }
                className="block w-full text-left text-sm text-text-secondary py-2"
              >
                {item}
              </button>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <ThemeToggle size="sm" />
              <Button variant="ghost" size="sm" onClick={handleDemo} className="flex-1">Demo</Button>
              <Button size="sm" onClick={() => window.open(SOURCE, '_blank', 'noopener,noreferrer')} className="flex-1">Get the code</Button>
            </div>
          </motion.div>
        )}
      </nav>


      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 overflow-hidden">
        {/* Blueprint background — top portion cropped to hide baked-in text */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'url(/media/bodyos-blueprints-landscape-notext.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Radial gradient overlay */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(91,124,250,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(78,205,196,0.05) 0%, transparent 50%)',
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/40 via-transparent to-bg-primary" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge variant="info" className="mt-6 mb-4 px-4 py-1.5 text-xs">
              <Scan className="w-3 h-3 mr-1.5 inline" />
              Community edition · source available
            </Badge>
          </motion.div>

          {/* Headline */}
          <h1 className="font-display text-[44px] md:text-[64px] lg:text-[72px] font-bold text-text-primary tracking-[-0.03em] leading-[1.05] mb-6">
            Your body.{' '}
            <span className="gradient-text">Optimized.</span>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-4 leading-relaxed">
            A fitness software foundation: web, mobile, computer vision and the research behind it.
          </p>

          <p className="text-sm text-text-tertiary max-w-lg mx-auto mb-10">
            A gift from MGLO Software to the fitness community. Yours to explore, adapt and use.
          </p>


          {/* 3D Analysis Orbit — primary visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12"
          >
            <AnalysisOrbit />
          </motion.div>




          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button size="lg" onClick={() => window.open(SOURCE, '_blank', 'noopener,noreferrer')} icon={<Download className="w-5 h-5" />} className="min-w-[200px]">
              Get the source
            </Button>
            <Button variant="secondary" size="lg" onClick={handleDemo} className="min-w-[200px]">
              Try Live Demo
            </Button>
          </div>

          {/* App store badges / trust signals */}
          <div className="flex items-center justify-center gap-6 text-xs text-text-tertiary mb-5">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> On-device processing</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> No wearables needed</span>
            <span className="hidden sm:flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Free to customize</span>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 text-text-tertiary"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>


      {/* ═══════════════════ METRICS BAR ═══════════════════ */}
      <section className="border-y border-border-subtle bg-bg-secondary/50">
        <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-accent-primary mb-2 flex justify-center">{m.icon}</div>
              <div className="font-mono text-3xl md:text-4xl font-bold text-text-primary">{m.value}</div>
              <div className="text-xs text-text-secondary mt-1">{m.label}</div>
            </motion.div>
          ))}
        </div>
      </section>


      {/* ═══════════════════ FEATURES (SEE / LEARN / GROW) ═══════════════════ */}
      <section id="features" className="py-14 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="neutral" className="mb-4">Core Intelligence</Badge>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-text-primary tracking-[-0.02em] mb-4">
              SEE &middot; LEARN &middot; GROW
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Explore the product design and the code behind it. Screens below use illustrative demo data.
            </p>
          </motion.div>

          <div className="space-y-16 md:space-y-20">
            {features.map((feature, i) => (
              <motion.div
                key={feature.pillar}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
                style={{ willChange: 'opacity, transform' }}
                className={cn(
                  'grid md:grid-cols-2 gap-10 md:gap-16 items-center',
                  i % 2 === 1 && 'md:direction-rtl'
                )}
              >
                {/* Text side */}
                <div className={cn(i % 2 === 1 && 'md:order-2')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-[12px] bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white`}
                    >
                      {feature.icon}
                    </div>
                    <span className="font-display text-sm font-bold tracking-[0.1em] text-text-tertiary uppercase">
                      {feature.pillar}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl md:text-3xl font-bold text-text-primary tracking-[-0.02em] mb-4">
                    {feature.title}
                  </h3>

                  <p className="text-text-secondary leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  <ul className="space-y-3">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-3 text-sm text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: feature.color }} />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual side */}
                <div className={cn('relative', i % 2 === 1 && 'md:order-1')}>
                  {i === 0 && (
                    /* SEE — Form Score Ring + skeleton overlay preview */
                    <GlassCard variant="elevated" className="p-8 mx-auto max-w-sm">
                      <div className="flex items-center justify-center gap-8">
                        <FormScoreRing score={87} size={130} />
                        <div>
                          <div className="font-mono text-sm text-text-tertiary mb-1">Push-Up</div>
                          <div className="font-mono text-3xl font-bold text-text-primary mb-1">87</div>
                          <div className="text-xs text-success">Excellent form</div>
                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle2 className="w-3 h-3 text-success" />
                              <span className="text-text-secondary">Core stability</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle2 className="w-3 h-3 text-success" />
                              <span className="text-text-secondary">Consistent depth</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-border-subtle flex justify-between text-xs text-text-tertiary">
                        <span>15 reps detected</span>
                        <span className="font-mono">2-0-2-0 tempo</span>
                      </div>
                    </GlassCard>
                  )}

                  {i === 1 && (
                    /* LEARN — Body Blueprint + checkpoint card */
                    <GlassCard variant="elevated" className="p-8 mx-auto max-w-sm">
                      <div className="flex items-center gap-6">
                        <BodyBlueprint
                          focusAreas={[
                            { id: '1', name: 'Shoulder', description: '', severity: 'medium', landmarkIndices: [11, 12] },
                            { id: '2', name: 'Pelvis', description: '', severity: 'low', landmarkIndices: [23, 24] },
                          ]}
                          size="sm"
                        />
                        <div>
                          <div className="font-mono text-4xl font-bold text-text-primary">78</div>
                          <div className="text-xs text-text-secondary">/100 Posture Score</div>
                          <div className="text-xs text-warning mt-2">2 focus areas</div>
                          <div className="mt-3 flex items-center gap-1 text-xs text-success">
                            <TrendingUp className="w-3 h-3" />
                            +6 from last month
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-border-subtle">
                        <div className="flex gap-2">
                          {[
                            { label: 'Anterior', image: '/media/anterior-view.png' },
                            { label: 'Posterior', image: '/media/posterior-view.png' },
                            { label: 'Left', image: '/media/left-side-view.png' },
                            { label: 'Right', image: '/media/right-side-view.png' },
                          ].map((angle) => (
                            <div key={angle.label} className="flex-1 aspect-[3/4] rounded-[6px] overflow-hidden relative">
                              <img src={angle.image} alt={angle.label} className="w-full h-full object-cover" loading="lazy" />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg-primary/95 via-bg-primary/60 to-transparent pt-4 pb-1.5 px-1">
                                <span className="text-[9px] font-medium text-text-secondary block text-center">{angle.label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </GlassCard>
                  )}

                  {i === 2 && (
                    /* GROW — Coach chat preview */
                    <GlassCard variant="elevated" className="p-6 mx-auto max-w-sm">
                      <div className="space-y-3">
                        <div className="flex justify-end">
                          <div className="bg-gradient-to-r from-accent-primary to-accent-secondary rounded-[14px] rounded-br-sm px-4 py-2.5 max-w-[85%]">
                            <p className="text-sm text-white">My right shoulder feels tight during overhead press. What should I do?</p>
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="glass rounded-[14px] rounded-bl-sm px-4 py-2.5 max-w-[85%]">
                            <p className="text-sm text-text-primary">Based on your checkpoint, your right shoulder sits 2cm higher than the left. Here's what I'd recommend:</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-text-secondary">1. Thoracic spine foam roll</p>
                              <p className="text-xs text-text-secondary">2. Wall slides — 3 × 10</p>
                              <p className="text-xs text-text-secondary">3. Band pull-aparts — 2 × 15</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="flex gap-2 pt-1">
                            {['Review my checkpoint', 'Create mobility plan'].map((chip) => (
                              <span key={chip} className="px-2.5 py-1 text-[10px] text-accent-primary border border-accent-primary/20 rounded-full">
                                {chip}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  )}

                  {/* Glow behind card */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.15 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 1.8, ease: 'easeOut' }}
                    className="absolute -inset-4 -z-10 rounded-[24px] blur-3xl"
                    style={{ background: feature.color, willChange: 'opacity' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════ BODY INTELLIGENCE SHOWCASE ═══════════════════ */}
      <section className="relative py-14 md:py-14 px-4 overflow-hidden">
        {/* HQ Background */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'url(/media/body-os-headquarters.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Radial glows */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 30% 40%, rgba(78,205,196,0.08) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(91,124,250,0.06) 0%, transparent 50%)',
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-primary/80 to-bg-primary" />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge variant="info" className="mb-4">
              <Scan className="w-3 h-3 mr-1.5 inline" />
              4-Angle Body Checkpoint
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-text-primary tracking-[-0.02em] mb-4">
              Your Body, <span className="gradient-text">Mapped</span>
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Four angles, a checkpoint timeline and a visual way to explore change. This product study uses sample scores and illustrative body data.
            </p>
          </motion.div>

          {/* 4-column image grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
            {[
              { label: 'Anterior', sublabel: 'Front View', image: '/media/anterior-view.png', glow: 'rgba(91,124,250,0.3)' },
              { label: 'Posterior', sublabel: 'Back View', image: '/media/posterior-view.png', glow: 'rgba(78,205,196,0.3)' },
              { label: 'Left Lateral', sublabel: 'Left Side', image: '/media/left-side-view.png', glow: 'rgba(212,165,116,0.3)' },
              { label: 'Right Lateral', sublabel: 'Right Side', image: '/media/right-side-view.png', glow: 'rgba(91,124,250,0.3)' },
            ].map((angle, i) => (
              <motion.div
                key={angle.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group"
              >
                <GlassCard variant="elevated" hover className="p-0 overflow-hidden relative">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={angle.image}
                      alt={`${angle.label} — ${angle.sublabel}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[inherit]"
                    style={{ boxShadow: `inset 0 0 40px ${angle.glow}, 0 0 30px ${angle.glow}` }}
                  />
                </GlassCard>
                <div className="mt-3 text-center">
                  <div className="text-sm font-bold text-text-primary">{angle.label}</div>
                  <div className="text-xs text-text-tertiary">{angle.sublabel}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard variant="subtle" className="p-5 md:p-6 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <Shield className="w-4 h-4 text-accent-secondary" />
                    <span className="text-sm font-medium text-text-primary">Quick &amp; Private</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Explore the checkpoint interface with sample data, then adapt the analysis and storage to your own installation.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => scrollTo('how-it-works')}
                >
                  See How It Works
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="py-14 md:py-14 px-4 bg-bg-secondary/30 border-y border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge variant="neutral" className="mb-4">Simple Process</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary tracking-[-0.02em] mb-4">
              How It Works
            </h2>
            <p className="text-text-secondary max-w-md mx-auto">
              Explore the demo, choose your starting point, and make it yours
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 md:gap-4">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative"
              >
                {/* Connector line (desktop) */}
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-border-default" />
                )}

                <GlassCard className="p-6 text-center relative">
                  <div className="font-mono text-xs text-accent-primary mb-3">{step.step}</div>
                  <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-4 text-accent-primary">
                    {step.icon}
                  </div>
                  <h3 className="font-display text-base font-bold text-text-primary mb-2">{step.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{step.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════ WEB PLATFORM TEASER ═══════════════════ */}
      <section className="py-14 md:py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge variant="neutral" className="mb-4">Command Center</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary tracking-[-0.02em] mb-4">
              Deep Analysis on Web
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Explore session analysis, progress dashboards and workout planning in the sample web workspace.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: <BarChart3 className="w-6 h-6" />, title: 'Session Replay', description: 'Explore sample form scores, movement breakdowns and the session review interface.' },
              { icon: <TrendingUp className="w-6 h-6" />, title: 'Progress Dashboard', description: 'Posture score trends, training consistency charts, and body checkpoint comparisons over time.' },
              { icon: <Dumbbell className="w-6 h-6" />, title: 'Workout Planning', description: 'Explore training plans, exercise logs and RPE tracking, ready to adapt to your practice.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6 h-full" hover>
                  <div className="w-10 h-10 rounded-[10px] bg-accent-primary/10 flex items-center justify-center mb-4 text-accent-primary">
                    {item.icon}
                  </div>
                  <h3 className="font-display text-base font-bold text-text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="secondary" onClick={handleDemo} icon={<ExternalLink className="w-4 h-4" />}>
              Explore the Demo
            </Button>
          </div>
        </div>
      </section>


      <section id="community" className="py-20 px-4 border-y border-border-subtle bg-bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <Badge variant="info" className="mb-5">From MGLO, with care</Badge>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-text-primary tracking-tight max-w-3xl mb-6">Good work should give someone else a head start.</h2>
          <p className="text-lg text-text-secondary max-w-2xl leading-relaxed mb-10">We built across the browser, the phone, native vision, data and machine learning. Now the source is yours to work with. Use it in your practice. Teach with it. Help it grow.</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {title:'Open the workshop',text:'The web, mobile, data and vision source, organized so you can find your part.',path:''},
              {title:'Make it your own',text:'A short guide and prepared agent instructions, starting with one change you can see.',path:'/blob/main/docs/CUSTOMIZE.md'},
              {title:'Join the work',text:'Share an improvement, an exercise insight or a clearer way to get started.',path:'/blob/main/CONTRIBUTING.md'},
            ].map(item=><a key={item.title} href={SOURCE+item.path} target="_blank" rel="noreferrer" className="block"><GlassCard className="p-7 h-full"><h3 className="font-display text-xl text-text-primary mb-3">{item.title} <ExternalLink className="inline w-4 h-4"/></h3><p className="text-sm text-text-secondary leading-relaxed">{item.text}</p></GlassCard></a>)}
          </div>
          <p className="text-sm text-text-secondary mt-8 max-w-3xl">Free for your own use and your paying fitness clients. Software resale and competing hosted software services require separate permission. <a className="text-accent-secondary underline" href={SOURCE+'/blob/main/LICENSE'} target="_blank" rel="noreferrer">Read the community license</a>.</p>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section id="faq" className="py-14 md:py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary tracking-[-0.02em] mb-4">
              Questions?
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-sm font-medium text-text-primary pr-4">{faq.q}</span>
                    <ChevronDown className={cn(
                      'w-4 h-4 text-text-tertiary flex-shrink-0 transition-transform',
                      openFaq === i && 'rotate-180'
                    )} />
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-4"
                    >
                      <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="py-14 md:py-14 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'url(/media/bodyos-blueprints-landscape-notext.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(91,124,250,0.1) 0%, transparent 60%)',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto text-center"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-text-primary tracking-[-0.02em] mb-5">
            What will you <span className="gradient-text">make of it?</span>
          </h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            Start with the demo. Find a part you care about. Make it useful for your community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => window.open(SOURCE, '_blank', 'noopener,noreferrer')} icon={<Download className="w-5 h-5" />} className="min-w-[200px]">
              Get the source
            </Button>
            <Button variant="secondary" size="lg" onClick={handleDemo} className="min-w-[200px]">
              Try Live Demo
            </Button>
          </div>
        </motion.div>
      </section>


      <footer className="border-t border-border-subtle py-12 px-4 bg-bg-secondary/30">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between gap-8 text-sm text-text-secondary">
          <div><p className="font-display text-xl text-text-primary mb-2">BodyOS</p><p>A gift to the fitness community.</p><a className="text-accent-secondary" href="https://mglo-software.com" target="_blank" rel="noreferrer">Made by MGLO Software</a></div>
          <div className="flex flex-wrap items-start gap-6">
            <a href={SOURCE} target="_blank" rel="noreferrer">Source</a>
            <a href={SOURCE+'/blob/main/CONTRIBUTING.md'} target="_blank" rel="noreferrer">Contribute</a>
            <a href={SOURCE+'/blob/main/LICENSE'} target="_blank" rel="noreferrer">License</a>
            <button onClick={()=>navigate('/privacy')}>Privacy</button>
            <button onClick={()=>navigate('/terms')}>Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
