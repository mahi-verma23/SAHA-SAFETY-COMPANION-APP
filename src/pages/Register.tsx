import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Home, MapPin, Phone, Plus, X } from "lucide-react";

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Personal Info
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Address Info
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [workplaceName, setWorkplaceName] = useState("");
  const [workAddress, setWorkAddress] = useState("");

  // Police Station Info
  const [stationName, setStationName] = useState("");
  const [stationAddress, setStationAddress] = useState("");
  const [stationPhone, setStationPhone] = useState("");

  // Emergency Contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { name: "", relationship: "", phone: "", email: "" },
    { name: "", relationship: "", phone: "", email: "" },
  ]);

  const addContact = () => {
    if (contacts.length < 6) {
      setContacts([...contacts, { name: "", relationship: "", phone: "", email: "" }]);
    }
  };

  const removeContact = (index: number) => {
    if (contacts.length > 2) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: fullName,
        phone_number: phoneNumber,
        date_of_birth: dateOfBirth,
        street_address: streetAddress,
        city,
        state,
        pincode,
        workplace_name: workplaceName,
        work_address: workAddress,
      });
      if (profileError) throw profileError;

      // Create police station
      const { error: stationError } = await supabase.from("police_stations").insert({
        user_id: user.id,
        station_name: stationName,
        address: stationAddress,
        phone: stationPhone,
      });
      if (stationError) throw stationError;

      // Create emergency contacts
      const validContacts = contacts.filter((c) => c.name && c.phone);
      if (validContacts.length >= 2) {
        const { error: contactsError } = await supabase.from("emergency_contacts").insert(
          validContacts.map((c, i) => ({
            user_id: user.id,
            name: c.name,
            relationship: c.relationship,
            phone: c.phone,
            email: c.email,
            is_primary: i === 0,
          }))
        );
        if (contactsError) throw contactsError;
      } else {
        throw new Error("Minimum 2 contacts required");
      }

      toast({
        title: "Registration complete!",
        description: "Your profile has been created successfully",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background p-4 pb-20">
      <Card className="max-w-md mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-sm text-muted-foreground">
            Join SAHA for comprehensive safety protection
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <Button
            variant={step === 1 ? "default" : "outline"}
            size="icon"
            className="rounded-full"
            onClick={() => setStep(1)}
          >
            <Home className="w-4 h-4" />
          </Button>
          <Button
            variant={step === 2 ? "default" : "outline"}
            size="icon"
            className="rounded-full"
            onClick={() => setStep(2)}
          >
            <MapPin className="w-4 h-4" />
          </Button>
          <Button
            variant={step === 3 ? "default" : "outline"}
            size="icon"
            className="rounded-full"
            onClick={() => setStep(3)}
          >
            <Phone className="w-4 h-4" />
          </Button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={10}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>
            <Button onClick={() => setStep(2)} className="w-full">
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Home Address</h3>
            <div className="space-y-2">
              <Label>Street Address *</Label>
              <Input
                placeholder="House number, street name"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pincode *</Label>
              <Input
                placeholder="6-digit pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
              />
            </div>
            <h3 className="font-semibold mt-6">Workplace Information</h3>
            <div className="space-y-2">
              <Label>Workplace Name</Label>
              <Input
                placeholder="Company/Organization name"
                value={workplaceName}
                onChange={(e) => setWorkplaceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Work Address</Label>
              <Input
                placeholder="Workplace address"
                value={workAddress}
                onChange={(e) => setWorkAddress(e.target.value)}
              />
            </div>

            <h3 className="font-semibold mt-6">Nearest Police Station</h3>
            <div className="space-y-2">
              <Label>Police Station Name *</Label>
              <Input
                placeholder="Station name"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Police Station Address *</Label>
              <Input
                placeholder="Complete address"
                value={stationAddress}
                onChange={(e) => setStationAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Police Station Phone *</Label>
              <Input
                placeholder="Contact number"
                value={stationPhone}
                onChange={(e) => setStationPhone(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Emergency Contacts *</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContact}
                disabled={contacts.length >= 6}
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum 2 contacts required. Maximum 6 allowed.
            </p>

            {contacts.map((contact, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg relative">
                {contacts.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => removeContact(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
                <p className="text-sm font-medium text-primary">Contact {index + 1}</p>
                <Input
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => updateContact(index, "name", e.target.value)}
                />
                <Input
                  placeholder="Relationship"
                  value={contact.relationship}
                  onChange={(e) => updateContact(index, "relationship", e.target.value)}
                />
                <Input
                  placeholder="Phone (10 digits)"
                  value={contact.phone}
                  onChange={(e) => updateContact(index, "phone", e.target.value)}
                  maxLength={10}
                />
                <Input
                  placeholder="Email (optional)"
                  type="email"
                  value={contact.email}
                  onChange={(e) => updateContact(index, "email", e.target.value)}
                />
              </div>
            ))}

            <div className="flex gap-2">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                {loading ? "Completing..." : "Complete Registration"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
