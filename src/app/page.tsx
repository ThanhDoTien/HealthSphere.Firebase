'use client';
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { Logo } from "@/components/Logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe, BarChart2, Utensils, Dumbbell, Bed, Heart, Briefcase, ChevronRight, Activity, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { t, setLocale } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: BarChart2,
      label: t('home.features.label.track'),
      title: t('home.features.track.title'),
      description: t('home.features.track.description'),
      image: "/assets/images/app_mockup.png",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      icon: Utensils,
      label: t('home.features.label.nutrition'),
      title: t('home.features.nutrition.title'),
      description: t('home.features.nutrition.description'),
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800",
      color: "bg-green-500/10 text-green-600",
      reverse: true,
    },
    {
      icon: Dumbbell,
      label: t('home.features.label.workout'),
      title: t('home.features.workout.title'),
      description: t('home.features.workout.description'),
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800",
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      icon: Bed,
      label: t('home.features.label.sleep'),
      title: t('home.features.sleep.title'),
      description: t('home.features.sleep.description'),
      image: "https://images.unsplash.com/photo-1541480601022-2308c0f02487?auto=format&fit=crop&q=80&w=800",
      color: "bg-indigo-500/10 text-indigo-600",
      reverse: true,
    }
  ];

  const stats = [
    { value: "98%", label: t('home.stats.satisfaction'), icon: Heart },
    { value: "2M+", label: t('home.stats.meals'), icon: Utensils },
    { value: "500k+", label: t('home.stats.users'), icon: Users },
    { value: "100%", label: t('home.stats.privacy'), icon: ShieldCheck },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-hidden selection:bg-primary/20">
      {/* Header - Transparent & Integrated with Scroll Logic */}
      <header className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 px-6 lg:px-12",
        scrolled ? "h-16 bg-white/80 backdrop-blur-md border-b shadow-sm" : "h-24 bg-transparent"
      )}>
        <div className="container mx-auto flex h-full items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <Logo className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
            <span className="text-2xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent tracking-tight">
              HealthSphere
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-foreground/70">
            <Link href="#features" className={cn("transition-colors hover:text-primary", !scrolled ? "text-foreground" : "text-foreground/70")}>{t('home.features.label')}</Link>
            <Link href="#stats" className={cn("transition-colors hover:text-primary", !scrolled ? "text-foreground" : "text-foreground/70")}>{t('home.nav.impact')}</Link>
            <Link href="#contact" className={cn("transition-colors hover:text-primary", !scrolled ? "text-foreground" : "text-foreground/70")}>{t('home.footer.contact')}</Link>
          </div>

          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2">
                <DropdownMenuItem onClick={() => setLocale('en')} className="rounded-xl cursor-pointer">English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale('vi')} className="rounded-xl cursor-pointer">Tiếng Việt</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" asChild className={cn("rounded-full font-bold px-6", !scrolled && "text-foreground hover:bg-black/5")}>
              <Link href="/login">{t('home.login')}</Link>
            </Button>
            <Button asChild className="rounded-full font-bold px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95">
              <Link href="/signup">{t('home.signup')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Wave Style */}
        <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
          {/* Background Background */}
          <div className="absolute inset-0 z-0">
             <Image
                src="/assets/images/hero_bg.png"
                alt="Modern Healthcare"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-white/40 backdrop-blur-none" />
          </div>

          <div className="container relative z-10 mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black tracking-widest uppercase mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Activity className="h-3 w-3" />
               {t('home.hero.badge')}
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {t('home.hero.title_part1')} <br/> 
              <span className="text-primary italic px-2">{t('home.hero.title_part2')}</span> {t('home.hero.title_part3')}
            </h1>
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-foreground/60 font-medium leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {t('home.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <Button size="lg" asChild className="rounded-full h-14 px-10 text-base font-bold bg-white text-black hover:bg-white/90 shadow-xl border border-black/5 hover:scale-105 transition-all">
                <Link href="/signup" className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  {t('home.hero.individual_btn')}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full h-14 px-10 text-base font-bold bg-black text-white hover:bg-black/90 border-none shadow-xl hover:scale-105 transition-all">
                <Link href="/login" className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-blue-400" />
                  {t('home.hero.partner_btn')}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Sections - Full Frame Images */}
        <section id="features" className="py-24 bg-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="space-y-32">
              {features.map((feature, idx) => (
                <div 
                  key={feature.title} 
                  className={cn(
                    "flex flex-col items-center gap-12 lg:gap-24",
                    feature.reverse ? "lg:flex-row-reverse" : "lg:flex-row"
                  )}
                >
                  {/* Image Side - Full Frame */}
                  <div className="w-full lg:w-1/2 relative group">
                    <div className="relative aspect-video overflow-hidden rounded-3xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]">
                       <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                  </div>

                  {/* Text Side */}
                  <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
                    <div className={cn(
                      "inline-block px-4 py-1 rounded-full text-[10px] font-black tracking-widest",
                      feature.color
                    )}>
                      {feature.label}
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
                      {feature.title}
                    </h2>
                    <p className="text-lg text-foreground/60 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                      {feature.description}
                    </p>
                    <div className="pt-4">
                      <Button variant="link" className="group p-0 h-auto text-base font-bold text-primary">
                        {t('home.impact.learn_more')} <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section - Dark Navy */}
        <section id="stats" className="py-24 bg-[#1A2B48] text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-20 text-white/90">
              {t('home.stats.title')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 sm:gap-16">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-4 group">
                  <div className="flex justify-center mb-4">
                     <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <stat.icon className="h-7 w-7 text-blue-400" />
                     </div>
                  </div>
                  <div className="text-4xl sm:text-6xl font-black tracking-tighter text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Final CTA */}
        <section id="contact" className="py-32 bg-white relative overflow-hidden text-center">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[80%] aspect-square bg-primary/5 rounded-full blur-[120px]" />
           
           <div className="container mx-auto px-6">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-8 max-w-4xl mx-auto leading-tight">
                {t('home.cta.title')}
              </h2>
              <p className="mx-auto mt-8 max-w-2xl text-lg text-foreground/50 font-medium mb-16 px-4">
                {t('home.cta.description')}
              </p>
              <div className="flex justify-center">
                <Button size="lg" asChild className="rounded-full h-16 px-16 text-xl font-black shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all">
                  <Link href="/signup">{t('home.cta.button')}</Link>
                </Button>
              </div>
           </div>
        </section>
      </main>

       {/* Footer */}
      <footer className="py-12 border-t bg-gray-50/50">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center space-x-2">
            <Logo className="h-7 w-7 text-primary" />
            <span className="font-black text-xl tracking-tight">HealthSphere</span>
          </div>
          
          <div className="text-xs text-foreground/50 font-medium">
            {t('home.footer.copyright')} | {t('home.footer.contact')}: <a href="mailto:healthsphere.vn@gmail.com" className="hover:text-primary transition-colors underline">healthsphere.vn@gmail.com</a>
          </div>

          <div className="flex gap-8">
             <div className="h-5 w-5 bg-foreground/10 rounded-full hover:bg-primary/20 cursor-pointer transition-colors" />
             <div className="h-5 w-5 bg-foreground/10 rounded-full hover:bg-primary/20 cursor-pointer transition-colors" />
             <div className="h-5 w-5 bg-foreground/10 rounded-full hover:bg-primary/20 cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}
