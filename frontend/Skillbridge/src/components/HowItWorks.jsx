export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: "👤",
      title: "Create Your Profile",
      description: "Sign up as a volunteer or NGO. Complete your profile with skills, experience, and preferences to get better matches."
    },
    {
      number: "02", 
      icon: "🔍",
      title: "Discover Opportunities",
      description: "Browse through various projects and opportunities. Use our smart filters to find causes that align with your skills and interests."
    },
    {
      number: "03",
      icon: "🤝", 
      title: "Connect & Collaborate",
      description: "Apply for projects, chat with organizations, and start making a meaningful impact in communities that need your skills."
    }
  ];

  return (
    <section className="py-24 px-[5%] bg-white" id="howitworks">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-5xl font-bold text-gray-800 mb-16">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-16">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 p-12 rounded-3xl text-center text-white relative overflow-hidden transition-transform duration-300 hover:-translate-y-2 group"
            >
              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                  {step.icon}
                </div>
                
                <div className="text-5xl font-bold mb-4 opacity-80">
                  {step.number}
                </div>
                
                <h3 className="text-2xl font-semibold mb-4">
                  {step.title}
                </h3>
                
                <p className="opacity-90 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}