<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
</script>

<template>
  <div class="px-6 py-12">
    <div class="mx-auto max-w-6xl">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="heading-h1">Giga Dev Hackathon</h1>
            <p class="mt-2 body-default text-muted-foreground">
              Guidelines, participation terms, and evaluation criteria for building on Paxeer Network.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">$10,000 USDT Prize</Badge>
            <Badge variant="secondary">Gas Subsidized</Badge>
            <Badge variant="secondary">Proof of Utility</Badge>
          </div>
        </div>

        <Card class="shadow-xl">
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
              Submissions open on <span class="font-medium">February 20, 2026</span> via the official portal.
            </CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-sm text-muted-foreground">
              Prepare a live demo, repo link, and a short technical whitepaper outlining scalability.
            </div>
            <a href="https://build.hyperpaxeer.com" target="_blank" rel="noopener noreferrer">
              <Button class="h-10">
                Open build portal
                <svg class="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </Button>
            </a>
          </CardContent>
        </Card>

        <div class="grid gap-4 lg:grid-cols-3">
          <Card class="shadow-xl lg:col-span-2">
            <CardHeader>
              <CardTitle>Hackathon Guidelines &amp; Participation Terms</CardTitle>
              <CardDescription>
                Read carefully before building and submitting. Participation implies acceptance of these terms.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <section class="space-y-3">
                <div class="flex items-center gap-2">
                  <Badge variant="outline">Phase I</Badge>
                  <div class="text-sm font-medium">Eligibility &amp; Project Scope</div>
                </div>
                <div class="space-y-3 text-sm text-muted-foreground">
                  <p>
                    The Paxeer Network Giga Dev Hackathon is open to individual developers and teams worldwide who are
                    committed to expanding the Paxeer ecosystem.
                  </p>
                  <p>
                    To be eligible for the <span class="font-medium">$10,000 USDT</span> grand prize, participants must
                    build and deploy a decentralized application (dApp) <span class="font-medium">directly on the Paxeer Network</span>.
                    Projects are primarily evaluated on <span class="font-medium">utility</span> and <span class="font-medium">utilization</span>.
                    We are looking for “sticky” applications—tools, games, or platforms that drive consistent user
                    transactions and engagement.
                  </p>
                  <p>
                    Paxeer is dedicated to lowering the barrier to entry. During the competition period, the network will
                    provide documentation, API access, and will <span class="font-medium">subsidize gas costs for approved developers</span>
                    so you can focus on innovation rather than infrastructure.
                  </p>
                </div>
              </section>

              <Separator />

              <section class="space-y-3">
                <div class="flex items-center gap-2">
                  <Badge variant="outline">Phase II</Badge>
                  <div class="text-sm font-medium">Submission &amp; Evaluation Criteria</div>
                </div>

                <div class="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Official submissions open on February 20, 2026 via <span class="font-medium">build.hyperpaxeer.com</span>.
                    Each submission must include:
                  </p>
                  <div class="grid gap-2 sm:grid-cols-2">
                    <div class="rounded-xl bg-muted p-4">
                      <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Required</div>
                      <div class="mt-2 space-y-1">
                        <div>Functional live demo</div>
                        <div>Repository link (public or private) for code review</div>
                        <div>Brief technical whitepaper outlining scalability</div>
                      </div>
                    </div>
                    <div class="rounded-xl bg-muted p-4">
                      <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Winner selection</div>
                      <div class="mt-2">
                        “Proof of Utility”: the app with the highest organic user volume and network interaction within
                        the post-submission monitoring window.
                      </div>
                    </div>
                  </div>

                  <p>
                    All code must be original. Any “wash trading” or artificial inflation of transaction volume will
                    result in immediate disqualification.
                  </p>
                  <p>
                    Developers retain intellectual property rights to their creations, but grant Paxeer Network the right
                    to feature the application in marketing materials to showcase ecosystem growth.
                  </p>
                </div>
              </section>

              <Separator />

              <section class="space-y-3">
                <div class="flex items-center gap-2">
                  <Badge variant="outline">Phase III</Badge>
                  <div class="text-sm font-medium">Admission Preferences</div>
                </div>

                <div class="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Admission and final victory are not based solely on a final pitch, but on a continuous assessment of
                    execution. Our committee monitors the following key signals:
                  </p>
                  <div class="grid gap-3 md:grid-cols-2">
                    <div class="rounded-xl bg-muted p-4">
                      <div class="font-medium text-foreground">Market traction</div>
                      <div class="mt-1">Ability to gain and sustain organic user activity.</div>
                    </div>
                    <div class="rounded-xl bg-muted p-4">
                      <div class="font-medium text-foreground">Scalability</div>
                      <div class="mt-1">Potential for broad, cross-chain interest.</div>
                    </div>
                    <div class="rounded-xl bg-muted p-4">
                      <div class="font-medium text-foreground">Build-in-public ethics</div>
                      <div class="mt-1">Founder discipline through consistent, high-quality updates.</div>
                    </div>
                    <div class="rounded-xl bg-muted p-4">
                      <div class="font-medium text-foreground">Community engagement</div>
                      <div class="mt-1">
                        Preference for teams that share progress on X (Twitter) and social platforms, engaging directly
                        with user feedback.
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl border border-border bg-background p-4">
                    <div class="text-sm font-medium">Additional incentives</div>
                    <div class="mt-2 space-y-2">
                      <div>
                        <span class="font-medium">Venture funding</span>: exceptional projects may qualify for
                        <span class="font-medium">$25,000</span> in initial seed funding at a fixed
                        <span class="font-medium">$1,000,000</span> valuation. These funds are restricted to operational
                        expenses.
                      </div>
                      <div>
                        <span class="font-medium">Foundation support</span>: winners receive ongoing technical
                        mentorship, a verified “Network Partner” badge, and a custom <span class="font-medium">paxeer.app</span>
                        subdomain to host their front-end interface.
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </CardContent>
          </Card>

          <Card class="shadow-xl">
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
              <CardDescription>Quick answers to the most common questions.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4 text-sm text-muted-foreground">
              <div class="space-y-1">
                <div class="font-medium text-foreground">1) Who is eligible to participate?</div>
                <div>
                  The hackathon is open to developers of all skill levels, from solo builders to established dev shops.
                  Whether you are building in DeFi, GameFi, or SocialFi, if your app can live on the Paxeer Network, you
                  are eligible.
                </div>
              </div>

              <Separator />

              <div class="space-y-1">
                <div class="font-medium text-foreground">2) What does “cover gas costs” mean?</div>
                <div>
                  Paxeer will provide a gas stipend or a whitelist for developer wallets. This allows you to deploy,
                  test, and run your dApp during the competition phase without transaction fees impacting your budget.
                </div>
              </div>

              <Separator />

              <div class="space-y-1">
                <div class="font-medium text-foreground">3) How is “Most Utilized Application” measured?</div>
                <div>
                  We will track on-chain metrics including unique active wallets (UAW), transaction frequency, and total
                  volume generated by your smart contracts over the evaluation period.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
