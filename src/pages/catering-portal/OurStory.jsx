import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Utensils, Sprout, Star, ArrowRight } from 'lucide-react';

const PRAIRIE_IMG = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'; // restaurant kitchen
const COMMUNITY_IMG = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80'; // community gathering

export default function OurStory() {
  return (
    <div className="text-cp-text">

      {/* ⚠️ PLACEHOLDER BANNER */}
      <div className="bg-amber-50 border-b-2 border-amber-400 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-start gap-3">
          <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-800">This page is a placeholder draft — content needs review before publishing.</p>
            <p className="text-xs text-amber-700 mt-0.5">The story, quotes, and details below are approximate. Please review with the team and update with accurate dates, names, and details before this goes live to the public.</p>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-cp-primary via-cp-primary/90 to-cp-primary/80 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6 text-white/90">
            <Heart className="w-4 h-4 text-cp-accent" /> More Than a Catering Company
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Food, Community,<br />and Second Chances
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            Candora Events and Catering Services is a social enterprise rooted in Candora Society's
            mission — creating meaningful employment pathways while delivering exceptional culinary experiences.
          </p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-20 px-4 bg-cp-bg">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cp-baby-blue mb-3">Our Foundation</p>
            <h2 className="font-heading text-3xl font-bold mb-5">Rooted in Candora Society</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Candora Society has served Edmonton's northeast communities for decades — providing employment support,
              counselling, youth programs, and wraparound services to individuals and families navigating life's challenges.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our Food Services division was born out of that same spirit: create real, sustained employment opportunities
              for program participants while building something the community could be proud of.
            </p>
            <p className="text-gray-600 leading-relaxed">
              When you book with us, you're not just getting great food — you're directly supporting people on their
              journey toward stable, meaningful work.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-md border border-cp-border">
            <img src={COMMUNITY_IMG} alt="Community gathering" className="w-full h-72 object-cover" />
          </div>
        </div>
      </section>

      {/* The Employment Connection */}
      <section className="py-20 px-4 bg-cp-muted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-cp-baby-blue mb-3">Why It Matters</p>
            <h2 className="font-heading text-3xl font-bold mb-4">The Employment Connection</h2>
            <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Our kitchens and catering operations serve as living classrooms — real workplaces where participants
              in Candora's employment programs gain hands-on experience, certifications, and confidence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Sprout, color: 'text-green-500', title: 'Real Work Experience', desc: 'Participants gain actual food service experience in operating businesses — not simulations. They serve real customers, meet real standards, and build real skills.' },
              { icon: Users, color: 'text-cp-primary', title: 'Wraparound Support', desc: 'Employment coaches, counsellors, and program staff walk alongside each participant — removing barriers and celebrating every milestone along the way.' },
              { icon: Star, color: 'text-cp-accent', title: 'Pathways to Careers', desc: 'Many participants move from our kitchens into full employment in the broader food and hospitality industry — with references, credentials, and confidence.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-8 border border-cp-border shadow-sm">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cp-muted mb-5 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jimmy & Prairie Catering */}
      <section className="py-20 px-4 bg-cp-bg">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <div className="rounded-2xl overflow-hidden shadow-md border border-cp-border order-2 md:order-1">
            <img src={PRAIRIE_IMG} alt="Prairie Catering kitchen" className="w-full h-80 object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <p className="text-xs font-bold uppercase tracking-widest text-cp-baby-blue mb-3">Where It All Began</p>
            <h2 className="font-heading text-3xl font-bold mb-2">A Mentor, a Kitchen,<br />and a Vision</h2>
            <div className="h-1 w-10 rounded-full bg-cp-accent mb-6" />
            <p className="text-gray-600 leading-relaxed mb-4">
              When Candora Society set out to launch a food services social enterprise, we knew we needed more than good
              intentions — we needed expertise. We found it in <span className="font-bold text-cp-text">Jimmy Shewchuk</span>,
              a veteran Edmonton restaurateur with decades of experience in the city's culinary scene.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Jimmy and his company, <span className="font-bold text-cp-text">Prairie Catering</span>, stepped in as a founding
              partner and mentor — sharing their knowledge, their networks, and their passion for great food with our team.
              Together, we launched <span className="font-bold text-cp-text">Auntie Bev's</span>, our first food service operation,
              named in honour of a beloved community matriarch.
            </p>
            <p className="text-gray-600 leading-relaxed">
              From that first kitchen, Prairie Catering helped us learn the business from the inside out — from sourcing
              ingredients and building menus to training staff and running a professional catering operation. Their
              generosity of spirit laid the foundation for everything we've built since.
            </p>
            <div className="mt-8 bg-cp-muted border-l-4 border-cp-accent rounded-r-xl px-6 py-4">
              <p className="text-sm italic text-gray-600 leading-relaxed">
                "Great food has the power to bring people together and open doors. We saw in Candora a real commitment
                to their community, and we were proud to help get the kitchen running."
              </p>
              <p className="text-xs font-bold text-cp-primary mt-2">— Jimmy Shewchuk, Prairie Catering</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Kitchens */}
      <section className="py-20 px-4 bg-cp-muted">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-cp-baby-blue mb-3">What We Operate</p>
          <h2 className="font-heading text-3xl font-bold mb-4">Our Food Service Operations</h2>
          <p className="text-gray-500 mb-12 max-w-2xl mx-auto">Each outlet is a place of business and a place of growth.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Auntie Bev's", desc: 'Our founding kitchen. A community staple serving comfort food with heart — named for a woman who embodied exactly that.' },
              { name: 'Cafe Candeur', desc: 'A welcoming café space offering fresh coffee, baked goods, and light meals in a warm, community-centred environment.' },
              { name: 'Community Lunch', desc: 'Affordable, nourishing lunches for the community — no one turned away. Dignity and deliciousness in every plate.' },
              { name: 'Catering & Events', desc: 'Full-service catering for corporate, community, and private events — bringing our food and mission to every table.' },
            ].map(({ name, desc }) => (
              <div key={name} className="bg-white rounded-2xl p-7 border border-cp-border shadow-sm text-left hover:shadow-md transition-shadow">
                <div className="w-8 h-1.5 rounded-full bg-cp-accent mb-4" />
                <h3 className="font-heading text-lg font-bold mb-2 text-cp-text">{name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-cp-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">Be Part of the Story</h2>
          <p className="text-white/80 mb-8 leading-relaxed">
            Every event you book with us is an investment in our community. Let's create something great together.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/catering-portal/book" className="bg-cp-accent text-white font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity inline-flex items-center gap-2">
              Book an Event <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/catering-portal/menu" className="bg-white/15 border border-white/30 text-white font-semibold px-8 py-3 rounded-full hover:bg-white/25 transition-colors">
              View Our Menu
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}