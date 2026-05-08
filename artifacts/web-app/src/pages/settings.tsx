import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetSettings, 
  getGetSettingsQueryKey,
  useUpdateSettings
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

const formSchema = z.object({
  password: z.string().min(1, "Password is required"),
  employeeSearch: z.string().min(1, "Employee search term is required"),
  defaultHudud: z.string().min(1, "Hudud is required"),
  defaultTuman: z.string().min(1, "Tuman is required"),
  defaultMahalla: z.string().min(1, "Mahalla is required"),
  defaultYonalish: z.string().min(1, "Yonalish is required"),
  defaultOy: z.string().min(1, "Oy is required"),
  defaultShartnomaUri: z.string().min(1, "Shartnoma Turi is required"),
  defaultIshBoshlangan: z.string().min(1, "Ish boshlangan is required"),
  defaultShartnamaSan: z.string().min(1, "Shartnama san is required"),
  defaultBajarilgan: z.string().min(1, "Bajarilgan ish is required"),
  headless: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Settings() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useGetSettings({
    query: {
      queryKey: getGetSettingsQueryKey()
    }
  });

  const updateMutation = useUpdateSettings();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      employeeSearch: "",
      defaultHudud: "",
      defaultTuman: "",
      defaultMahalla: "",
      defaultYonalish: "",
      defaultOy: "",
      defaultShartnomaUri: "",
      defaultIshBoshlangan: "",
      defaultShartnamaSan: "",
      defaultBajarilgan: "",
      headless: true,
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        ...settings,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Settings saved successfully" });
      },
      onError: (err) => {
        toast({ 
          title: "Failed to save settings", 
          description: err.error || "Unknown error",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bot Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure defaults and credentials for the automation scripts.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Core Settings</CardTitle>
              <CardDescription>Authentication and execution behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mehnat.uz Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="***" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employeeSearch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Search Keyword</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Oqil" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="headless"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-secondary/20 mt-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Headless Mode</FormLabel>
                      <FormDescription>
                        Run browser in background without UI window (faster, recommended for production).
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Default Form Values</CardTitle>
              <CardDescription>These values will be applied uniformly across all form entries.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="defaultHudud"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hudud (Region)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultTuman"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tuman (District)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultMahalla"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mahalla</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultYonalish"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yo'nalish (Direction)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultOy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oy (Month)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultShartnomaUri"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shartnoma Turi</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultIshBoshlangan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ish Boshlangan Sana</FormLabel>
                      <FormControl><Input placeholder="YYYY-MM-DD" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultShartnamaSan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shartnoma Sanasi</FormLabel>
                      <FormControl><Input placeholder="YYYY-MM-DD" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="defaultBajarilgan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bajarilgan Ish (Completed Work Description)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={updateMutation.isPending} className="w-full md:w-auto min-w-[200px]">
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
