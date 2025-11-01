import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { toast } from 'sonner';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
  e.preventDefault();

  // 1. Must ensure 'emailjs' is imported/defined
  // 2. Must use your actual credentials here
  const serviceId = 'service_0n3u1tq'; 
  const templateId = 'template_xfz6qwk';
  const publicKey = 'EhAWolntxwsU7FE8d'; 

  const templateParams = {
    from_name: formData.name,
    from_email: formData.email,
    to_name: 'SkillBridge team',
    subject: formData.subject,
    message: formData.message
  };

  emailjs.send(serviceId, templateId, templateParams, publicKey)
    .then((response) => {
      console.log('SUCCESS!', response.status, response.text);
      toast.success('Your message has been sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' }); 
    }) 
    .catch((err) => { 
      console.error('FAILED...', err);
      toast.error('Failed to send message. Please try again later.');
    });
};

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactItems = [
    {
      icon: "📧",
      title: "Email",
      content: "contact@skillbridge.org"
    },
    {
      icon: "📞", 
      title: "Phone",
      content: "+1 (555) 123-4567"
    },
    {
      icon: "📍",
      title: "Address", 
      content: "123 Impact Street\nCommunity City, CC 12345"
    },
    {
      icon: "🕒",
      title: "Support Hours",
      content: "Monday - Friday: 9AM - 6PM\nWeekend: 10AM - 4PM"
    }
  ];

  return (
    <section className="py-24 px-[5%] bg-gradient-to-br from-slate-50 to-blue-100" id="contact">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-5xl font-bold text-gray-800 mb-12">
          Contact Us
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-12">
          {/* Contact Info */}
          <div>
            <h3 className="text-3xl text-gray-800 mb-8">
              Get in Touch
            </h3>
            
            <div className="space-y-8">
              {contactItems.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">
                      {item.title}
                    </div>
                    <div className="text-gray-600 whitespace-pre-line">
                      {item.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="bg-white p-12 rounded-3xl shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="name" className="block mb-2 font-semibold text-gray-800">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-colors focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block mb-2 font-semibold text-gray-800">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your e-mail"
                  required
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-colors focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block mb-2 font-semibold text-gray-800">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter your subject"
                  required
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-colors focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block mb-2 font-semibold text-gray-800">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Enter your message"
                  rows={5}
                  required
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-colors focus:outline-none focus:border-indigo-500 resize-vertical"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}