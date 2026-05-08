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
  password: z.string().min(1, "Parol majburiy"),
  employeeSearch: z.string().min(1, "Xodim qidiruv so'zi majburiy"),
  defaultHudud: z.string().min(1, "Hudud majburiy"),
  defaultTuman: z.string().min(1, "Tuman majburiy"),
  defaultMahalla: z.string().min(1, "Mahalla majburiy"),
  defaultYonalish: z.string().min(1, "Yo'nalish majburiy"),
  defaultOy: z.string().min(1, "Oy majburiy"),
  defaultShartnomaUri: z.string().min(1, "Shartnoma turi majburiy"),
  defaultIshBoshlangan: z.string().min(1, "Ish boshlangan sana majburiy"),
  defaultShartnamaSan: z.string().min(1, "Shartnoma sanasi majburiy"),
  defaultBajarilgan: z.string().min(1, "Bajarilgan ish majburiy"),
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
      form.reset({ ...settings });
    }
  }, [settings, form]);

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Sozlamalar saqlandi" });
      },
      onError: (err) => {
        toast({ 
          title: "Sozlamalarni saqlashda xato", 
          description: err.error || "Noma'lum xato",
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
        <h2 className="text-2xl font-bold tracking-tight">Bot sozlamalari</h2>
        <p className="text-sm text-muted-foreground mt-1">Avtomatlashtirish uchun standart qiymatlar va kirish ma'lumotlari.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Asosiy sozlamalar</CardTitle>
              <CardDescription>Tizimga kirish va ishlash sozlamalari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mehnat.uz paroli</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="***" {...field} data-testid="input-password" />
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
                      <FormLabel>Xodim qidiruv kalit so'zi</FormLabel>
                      <FormControl>
                        <Input placeholder="masalan: TEMURSULTON" {...field} data-testid="input-employee-search" />
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
                      <FormLabel className="text-base">Fonsiz rejim (Headless)</FormLabel>
                      <FormDescription>
                        Brauzer oynasisiz ishlasin — tezroq va serverlar uchun tavsiya etiladi.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-headless"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Standart forma qiymatlari</CardTitle>
              <CardDescription>Bu qiymatlar barcha forma yozuvlariga avtomatik qo'llaniladi.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="defaultHudud"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hudud</FormLabel>
                      <FormControl><Input {...field} data-testid="input-hudud" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultTuman"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tuman</FormLabel>
                      <FormControl><Input {...field} data-testid="input-tuman" /></FormControl>
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
                      <FormControl><Input {...field} data-testid="input-mahalla" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultYonalish"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yo'nalish</FormLabel>
                      <FormControl><Input {...field} data-testid="input-yonalish" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultOy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oy</FormLabel>
                      <FormControl><Input {...field} data-testid="input-oy" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultShartnomaUri"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shartnoma turi</FormLabel>
                      <FormControl><Input {...field} data-testid="input-shartnoma-turi" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultIshBoshlangan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ish boshlangan sana</FormLabel>
                      <FormControl><Input placeholder="YYYY-MM-DD" {...field} data-testid="input-ish-boshlangan" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultShartnamaSan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shartnoma sanasi</FormLabel>
                      <FormControl><Input placeholder="YYYY-MM-DD" {...field} data-testid="input-shartnoma-sana" /></FormControl>
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
                        <FormLabel>Bajarilgan ish (xizmat) turi</FormLabel>
                        <FormControl><Input {...field} data-testid="input-bajarilgan" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={updateMutation.isPending} className="w-full md:w-auto min-w-[200px]" data-testid="button-save-settings">
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Sozlamalarni saqlash
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
