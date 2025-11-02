import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Vote, BarChart3, Users, FileCheck, QrCode } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "Privacidade em Primeiro Lugar",
      description: "Seu voto é anônimo por padrão. Toda apuração ocorre com segurança e integridade absoluta."
    },
    {
      icon: Vote,
      title: "Votação em Tempo Real",
      description: "Acompanhe os resultados conforme acontecem, com transparência total no processo."
    },
    {
      icon: BarChart3,
      title: "Relatórios Detalhados",
      description: "Gere relatórios completos em PDF e Markdown para arquivo e consulta futura."
    }
  ];

  const quickActions = [
    {
      icon: Users,
      title: "Iniciar Nova Comissão",
      description: "Configure cargos, defina regras e gere link/QR para participantes",
      variant: "default" as const
    },
    {
      icon: FileCheck,
      title: "Pesquisa de Sugestões",
      description: "Colete indicações da igreja antes da votação oficial",
      variant: "secondary" as const
    },
    {
      icon: QrCode,
      title: "Entrar via Link/QR",
      description: "Participe de uma comissão ou pesquisa em andamento",
      variant: "outline" as const
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="container relative mx-auto px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              Sistema de Gerenciamento de Nomeações Adventista
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Bem-vindo ao <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">SIGNA</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Torne suas comissões de nomeações transparentes, organizadas e eficientes. 
              Do levantamento de sugestões à votação final, com total sigilo e auditoria completa.
            </p>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 shadow-lg transition-all hover:shadow-xl">
                <Users className="h-5 w-5" />
                Começar Agora
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <BarChart3 className="h-5 w-5" />
                Ver Resultados
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Notice */}
      <section className="border-y border-border/50 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto flex max-w-4xl items-center gap-4 rounded-lg bg-primary/5 p-6">
            <Shield className="h-12 w-12 shrink-0 text-primary" />
            <div>
              <h3 className="mb-1 font-semibold text-foreground">Sigilo e Integridade Garantidos</h3>
              <p className="text-sm text-muted-foreground">
                Seu voto é anônimo por padrão, salvo quando necessário e acordado entre todos. 
                Toda a apuração ocorre com segurança, integridade e total transparência no processo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">Ações Rápidas</h2>
          <p className="text-muted-foreground">Escolha uma opção para começar</p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index}
                className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 text-primary transition-all group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant={action.variant} className="w-full">
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-gradient-to-b from-muted/20 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground">Por Que Escolher o SIGNA?</h2>
            <p className="text-muted-foreground">Recursos pensados para garantir transparência e eficiência</p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <h3 className="mb-1 text-lg font-semibold text-foreground">SIGNA</h3>
              <p className="text-sm text-muted-foreground">Sistema de Gerenciamento de Nomeações Adventista</p>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-primary">Ajuda</a>
              <a href="#" className="transition-colors hover:text-primary">Privacidade</a>
              <a href="#" className="transition-colors hover:text-primary">Termos de Uso</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
