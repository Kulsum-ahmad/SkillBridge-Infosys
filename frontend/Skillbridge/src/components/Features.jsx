export function Features() {
  const features = [
    {
      icon: "🎯",
      title: "Smart Skill Matching",
      description: "Our AI-powered algorithm matches volunteers with NGOs based on skills, location, and project requirements for optimal collaboration."
    },
    {
      icon: "💬",
      title: "Real-time Communication", 
      description: "Built-in chat system enables seamless communication between volunteers and organizations throughout the project lifecycle."
    },
    {
      icon: "📊",
      title: "Impact Tracking",
      description: "Monitor and measure the impact of your contributions with detailed analytics and progress tracking tools."
    },
    {
      icon: "🏆",
      title: "Recognition System",
      description: "Earn badges, certificates, and recognition for your volunteer work to showcase your community contributions."
    },
    {
      icon: "🔒",
      title: "Secure Platform",
      description: "Enterprise-grade security ensures your data is protected while maintaining transparency in all transactions."
    },
    {
      icon: "🌍",
      title: "Global Community",
      description: "Connect with volunteers and NGOs worldwide to create cross-cultural collaborations and global impact."
    }
  ];

  return (
    <section className="py-24 px-[5%] bg-gradient-to-br from-indigo-500 to-purple-600 text-white" id="features">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-5xl font-bold mb-16">
          Platform Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20 transition-all duration-300 hover:-translate-y-2 hover:bg-white/20"
            >
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl mb-6">
                {feature.icon}
              </div>
              
              <h3 className="text-2xl font-semibold mb-4">
                {feature.title}
              </h3>
              
              <p className="opacity-90 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}