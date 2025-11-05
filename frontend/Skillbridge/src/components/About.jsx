import skillBridgeTeamImage from 'figma:asset/fc60daf4995a4621dd27f5c61d3f0965aa04eaef.png';

export function About() {
  return (
    <section className="py-24 px-[5%] bg-gradient-to-br from-slate-50 to-blue-100" id="about">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-5xl font-bold text-gray-800 mb-12">
          About SkillBridge
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
          <div className="space-y-6">
            <h3 className="text-3xl text-gray-800 mb-6">
              Empowering Change Through Skills
            </h3>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              SkillBridge is a revolutionary platform that connects talented volunteers with NGOs and
              non-profit organizations. We believe that everyone has unique skills that can make a difference
              in the world.
            </p>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Our mission is to create a sustainable ecosystem where passionate individuals can contribute
              their expertise to meaningful causes, while organizations can access the talent they need to
              amplify their impact.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Join thousands of volunteers and hundreds of NGOs who are already making a difference through
              SkillBridge.
            </p>
          </div>
          
          <div className="text-center">
            <img 
              src={skillBridgeTeamImage}
              alt="SkillBridge connecting volunteers with NGOs across different skill domains" 
              className="w-full max-w-lg rounded-2xl shadow-2xl object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}