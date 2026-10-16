import { useState, useEffect } from "react";
import { Plus, X, Users, Phone, Mail, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

export default function Contacts() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "", relationship: "", phone: "", email: ""
  });

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast({ title: "Missing fields", description: "Name and phone are required", variant: "destructive" });
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("emergency_contacts").insert({
        user_id: user.id, ...newContact
      });
      if (error) throw error;
      toast({ title: "✅ Contact added", description: "Emergency contact added successfully" });
      setNewContact({ name: "", relationship: "", phone: "", email: "" });
      setOpen(false);
      fetchContacts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Contact removed" });
      fetchContacts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, hsl(340 100% 98%), hsl(280 100% 98%))' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 pb-24 page-enter"
      style={{ background: 'linear-gradient(135deg, hsl(340 100% 98%) 0%, hsl(280 100% 98%) 100%)' }}
    >
      <div className="max-w-md mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' }}
            >
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Emergency Contacts</h1>
              <p className="text-xs text-muted-foreground">{contacts.length} contact(s) added</p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all btn-gradient"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle className="gradient-text">Add Emergency Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary" /> Name *
                  </Label>
                  <Input
                    placeholder="Contact name"
                    value={newContact.name}
                    onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                    className="rounded-xl border-pink-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4 text-primary" /> Relationship
                  </Label>
                  <Input
                    placeholder="e.g., Mother, Friend"
                    value={newContact.relationship}
                    onChange={e => setNewContact({ ...newContact, relationship: e.target.value })}
                    className="rounded-xl border-pink-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-primary" /> Phone *
                  </Label>
                  <Input
                    placeholder="10-digit phone number"
                    value={newContact.phone}
                    onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                    maxLength={10}
                    className="rounded-xl border-pink-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-primary" /> Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newContact.email}
                    onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                    className="rounded-xl border-pink-200"
                  />
                </div>
                <button
                  onClick={handleAddContact}
                  className="w-full py-3 rounded-xl font-semibold text-white btn-gradient"
                >
                  Add Contact
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Empty state */}
        {contacts.length === 0 ? (
          <div
            className="p-8 text-center rounded-3xl"
            style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(236, 72, 153, 0.15)'
            }}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center float"
              style={{ background: 'rgba(236, 72, 153, 0.1)' }}
            >
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold gradient-text mb-2">No contacts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add emergency contacts to enable SOS alerts
            </p>
            <button
              onClick={() => setOpen(true)}
              className="px-6 py-2 rounded-xl text-sm font-medium text-white btn-gradient"
            >
              Add First Contact
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact, index) => (
              <div
                key={contact.id}
                className="p-4 rounded-2xl card-hover"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(236, 72, 153, 0.15)',
                  animation: `slideUp 0.3s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' }}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{contact.name}</h3>
                      {contact.relationship && (
                        <p className="text-xs text-primary font-medium">{contact.relationship}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm text-foreground">{contact.phone}</p>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-red-50"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info card */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'rgba(236, 72, 153, 0.05)',
            border: '1px solid rgba(236, 72, 153, 0.15)'
          }}
        >
          <p className="text-xs text-center text-muted-foreground">
            💡 These contacts will receive SMS alerts with your location when SOS is triggered
          </p>
        </div>
      </div>

      <BottomNav currentTab="contacts" onTabChange={() => {}} />
    </div>
  );
}