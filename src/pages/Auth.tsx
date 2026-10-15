import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import logo from "@/assets/logo.jpeg";
import { Shield, Mail, Lock } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast({
            title: "Password mismatch",
            description: "Passwords do not match",
            variant: "destructive"
          });
          return;
        }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          toast({ title: "Account created!", description: "Please complete your profile setup" });
          navigate("/register");
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          navigate("/register");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 page-enter"
      style={{
        background: 'linear-gradient(135deg, hsl(340 100% 96%) 0%, hsl(280 100% 96%) 50%, hsl(340 100% 98%) 100%)'
      }}
    >
      {/* Decorative blobs */}
      <div
        className="fixed top-[-100px] right-[-100px] w-80 h-80 rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(340 80% 70%), transparent)' }}
      />
      <div
        className="fixed bottom-[-100px] left-[-100px] w-80 h-80 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(280 70% 65%), transparent)' }}
      />

      {/* Card */}
      <div
        className="w-full max-w-md p-8 rounded-3xl space-y-6"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 20px 60px rgba(236, 72, 153, 0.15)'
        }}
      >
        {/* Logo section */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex">
            <div
              className="absolute inset-0 rounded-full opacity-40"
              style={{
                background: 'radial-gradient(circle, hsl(340 80% 70%), transparent)',
                filter: 'blur(12px)',
                transform: 'scale(1.3)'
              }}
            />
            <img
              src={logo}
              alt="SAHA Logo"
              className="w-24 h-24 rounded-full object-cover relative z-10 ring-4 ring-white shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text">SAHA</h1>
            <p className="text-sm text-muted-foreground mt-1">for you, with you</p>
          </div>

          {/* Toggle tabs */}
          <div
            className="flex rounded-2xl p-1 mt-4"
            style={{ background: 'rgba(236, 72, 153, 0.1)' }}
          >
            <button
              onClick={() => setIsSignUp(true)}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: isSignUp ? 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' : 'transparent',
                color: isSignUp ? 'white' : 'hsl(340 80% 60%)',
                boxShadow: isSignUp ? '0 4px 12px rgba(236, 72, 153, 0.3)' : 'none'
              }}
            >
              Create Account
            </button>
            <button
              onClick={() => setIsSignUp(false)}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: !isSignUp ? 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' : 'transparent',
                color: !isSignUp ? 'white' : 'hsl(340 80% 60%)',
                boxShadow: !isSignUp ? '0 4px 12px rgba(236, 72, 153, 0.3)' : 'none'
              }}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-300"
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-300"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all btn-gradient"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Please wait...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                {isSignUp ? "Create Account" : "Sign In"}
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          🔒 Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
}