import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, User, Mail, Phone, Building2, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const roles = [
  { value: "admin", label: "Admin", icon: "🛡️", description: "System administration" },
  { value: "dispatcher", label: "Dispatcher", icon: "📡", description: "Central command and coordination" },
  { value: "police", label: "Police", icon: "🚔", description: "Law enforcement response" },
  { value: "ambulance", label: "Ambulance", icon: "🚑", description: "Medical emergency response" },
  { value: "fire", label: "Fire Department", icon: "🚒", description: "Fire and rescue operations" },
  { value: "hospital", label: "Hospital", icon: "🏥", description: "Hospital and patient preparation" },
];

const cities = [
  { value: "Yaounde", label: "Yaounde", description: "Capital City" },
  { value: "Douala", label: "Douala", description: "Economic Capital" },
  { value: "Bamenda", label: "Bamenda", description: "Northwest Region" },
  { value: "Buea", label: "Buea", description: "Southwest Region" },
];

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    city: "",
    organization: "",
  });

  const signupMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/auth/signup", data);
    },
    onSuccess: () => {
      toast({
        title: "Account Created",
        description: "Your account has been created. You can now sign in.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role || !formData.city) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    signupMutation.mutate(formData);
  };

  const canProceedStep1 = formData.firstName && formData.lastName && formData.email;
  const canProceedStep2 = formData.role && formData.city;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join SAFEROUTE CM - Road Safety System
          </CardDescription>
          <div className="flex justify-center gap-2 mt-4">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      data-testid="input-first-name"
                      placeholder="John"
                      className="pl-10"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    data-testid="input-last-name"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    placeholder="john.doe@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    placeholder="+237 6XX XXX XXX"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                data-testid="button-next-step1"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Select Your Role</h3>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    data-testid={`role-${role.value}`}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.role === role.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover-elevate'
                    }`}
                    onClick={() => setFormData({ ...formData, role: role.value })}
                  >
                    <span className="text-2xl">{role.icon}</span>
                    <p className="font-medium mt-2">{role.label}</p>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  </button>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label>Select Your City *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value })}
                >
                  <SelectTrigger data-testid="select-city">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.value} value={city.value} data-testid={`city-${city.value}`}>
                        {city.label} - {city.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                  data-testid="button-back-step2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  data-testid="button-next-step2"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Organization Details</h3>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="organization"
                    data-testid="input-organization"
                    placeholder="e.g., Yaounde Central Police Station"
                    className="pl-10"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Account Summary</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {formData.firstName} {formData.lastName}</p>
                  <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                  <p><span className="text-muted-foreground">Role:</span> {roles.find(r => r.value === formData.role)?.label}</p>
                  <p><span className="text-muted-foreground">City:</span> {formData.city}</p>
                  {formData.phone && <p><span className="text-muted-foreground">Phone:</span> {formData.phone}</p>}
                  {formData.organization && <p><span className="text-muted-foreground">Organization:</span> {formData.organization}</p>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(2)}
                  data-testid="button-back-step3"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={signupMutation.isPending}
                  data-testid="button-create-account"
                >
                  {signupMutation.isPending ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account?</span>{" "}
            <Button variant="ghost" className="p-0 h-auto" onClick={() => setLocation("/")} data-testid="link-signin">
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
