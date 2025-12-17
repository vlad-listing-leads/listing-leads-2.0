'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Copy, Check, Plus, Trash2, Settings, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

// Color definitions matching globals.css
const colors = {
  semantic: [
    { name: 'background', var: '--background', desc: 'Page background' },
    { name: 'foreground', var: '--foreground', desc: 'Primary text color' },
    { name: 'card', var: '--card', desc: 'Card background' },
    { name: 'card-foreground', var: '--card-foreground', desc: 'Card text color' },
    { name: 'popover', var: '--popover', desc: 'Popover background' },
    { name: 'popover-foreground', var: '--popover-foreground', desc: 'Popover text' },
    { name: 'primary', var: '--primary', desc: 'Primary actions' },
    { name: 'primary-foreground', var: '--primary-foreground', desc: 'Primary text' },
    { name: 'secondary', var: '--secondary', desc: 'Secondary elements' },
    { name: 'secondary-foreground', var: '--secondary-foreground', desc: 'Secondary text' },
    { name: 'muted', var: '--muted', desc: 'Muted backgrounds' },
    { name: 'muted-foreground', var: '--muted-foreground', desc: 'Muted text' },
    { name: 'accent', var: '--accent', desc: 'Accent highlights' },
    { name: 'accent-foreground', var: '--accent-foreground', desc: 'Accent text' },
    { name: 'destructive', var: '--destructive', desc: 'Destructive actions' },
    { name: 'border', var: '--border', desc: 'Border color' },
    { name: 'input', var: '--input', desc: 'Input borders' },
    { name: 'ring', var: '--ring', desc: 'Focus rings' },
  ],
  chart: [
    { name: 'chart-1', var: '--chart-1', desc: 'Chart color 1' },
    { name: 'chart-2', var: '--chart-2', desc: 'Chart color 2' },
    { name: 'chart-3', var: '--chart-3', desc: 'Chart color 3' },
    { name: 'chart-4', var: '--chart-4', desc: 'Chart color 4' },
    { name: 'chart-5', var: '--chart-5', desc: 'Chart color 5' },
  ],
  sidebar: [
    { name: 'sidebar', var: '--sidebar', desc: 'Sidebar background' },
    { name: 'sidebar-foreground', var: '--sidebar-foreground', desc: 'Sidebar text' },
    { name: 'sidebar-primary', var: '--sidebar-primary', desc: 'Sidebar primary' },
    { name: 'sidebar-accent', var: '--sidebar-accent', desc: 'Sidebar accent' },
    { name: 'sidebar-border', var: '--sidebar-border', desc: 'Sidebar border' },
  ],
}

function ColorSwatch({ name, cssVar, description }: { name: string; cssVar: string; description: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssVar)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={copyToClipboard}
    >
      <div
        className="w-12 h-12 rounded-lg border border-border shadow-sm shrink-0"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{name}</span>
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        <code className="text-xs text-muted-foreground">{cssVar}</code>
        <p className="text-xs text-muted-foreground/70 truncate">{description}</p>
      </div>
    </div>
  )
}

export default function StyleGuidePage() {
  const [switchValue, setSwitchValue] = useState(false)

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Style Guide</h1>
        <p className="text-muted-foreground mt-2">
          Design system reference for colors, typography, and components.
        </p>
      </div>

      {/* Colors Section */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">Colors</h2>

        <div className="space-y-8">
          {/* Semantic Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Semantic Colors</CardTitle>
              <CardDescription>Core color tokens used throughout the app</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {colors.semantic.map((color) => (
                  <ColorSwatch
                    key={color.name}
                    name={color.name}
                    cssVar={color.var}
                    description={color.desc}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chart Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chart Colors</CardTitle>
              <CardDescription>Colors for data visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {colors.chart.map((color) => (
                  <ColorSwatch
                    key={color.name}
                    name={color.name}
                    cssVar={color.var}
                    description={color.desc}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sidebar Colors</CardTitle>
              <CardDescription>Colors specific to the sidebar component</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {colors.sidebar.map((color) => (
                  <ColorSwatch
                    key={color.name}
                    name={color.name}
                    cssVar={color.var}
                    description={color.desc}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Typography Section */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">Typography</h2>

        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Headings */}
            <div>
              <p className="text-sm text-muted-foreground mb-4">Headings</p>
              <div className="space-y-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">text-4xl</span>
                  <h1 className="text-4xl font-bold text-foreground">Heading 1</h1>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">text-3xl</span>
                  <h2 className="text-3xl font-bold text-foreground">Heading 2</h2>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">text-2xl</span>
                  <h3 className="text-2xl font-semibold text-foreground">Heading 3</h3>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">text-xl</span>
                  <h4 className="text-xl font-semibold text-foreground">Heading 4</h4>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">text-lg</span>
                  <h5 className="text-lg font-medium text-foreground">Heading 5</h5>
                </div>
              </div>
            </div>

            <Separator />

            {/* Body Text */}
            <div>
              <p className="text-sm text-muted-foreground mb-4">Body Text</p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1">text-base</span>
                  <p className="text-base text-foreground">
                    This is the default body text size. It should be used for most content throughout the application.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1">text-sm</span>
                  <p className="text-sm text-foreground">
                    Smaller text for secondary information and UI elements.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1">text-xs</span>
                  <p className="text-xs text-foreground">
                    Extra small text for labels, captions, and metadata.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Text Colors */}
            <div>
              <p className="text-sm text-muted-foreground mb-4">Text Colors</p>
              <div className="space-y-2">
                <p className="text-foreground">text-foreground - Primary text</p>
                <p className="text-muted-foreground">text-muted-foreground - Secondary text</p>
                <p className="text-primary">text-primary - Primary color text</p>
                <p className="text-destructive">text-destructive - Error/destructive text</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Buttons Section */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">Buttons</h2>

        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Variants */}
            <div>
              <p className="text-sm text-muted-foreground mb-4">Variants</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>

            <Separator />

            {/* Sizes */}
            <div>
              <p className="text-sm text-muted-foreground mb-4">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg">Large</Button>
                <Button size="default">Default</Button>
                <Button size="sm">Small</Button>
                <Button size="icon"><Plus className="w-4 h-4" /></Button>
                <Button size="icon-sm"><Plus className="w-4 h-4" /></Button>
                <Button size="icon-lg"><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            <Separator />

            {/* With Icons */}
            <div>
              <p className="text-sm text-muted-foreground mb-4">With Icons</p>
              <div className="flex flex-wrap gap-3">
                <Button><Plus className="w-4 h-4" /> Add New</Button>
                <Button variant="outline"><Settings className="w-4 h-4" /> Settings</Button>
                <Button variant="destructive"><Trash2 className="w-4 h-4" /> Delete</Button>
                <Button variant="secondary"><Mail className="w-4 h-4" /> Send Email</Button>
              </div>
            </div>

            <Separator />

            {/* States */}
            <div>
              <p className="text-sm text-muted-foreground mb-4">States</p>
              <div className="flex flex-wrap gap-3">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Form Elements Section */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">Form Elements</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-input">Default Input</Label>
                <Input id="default-input" placeholder="Enter text..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disabled-input">Disabled Input</Label>
                <Input id="disabled-input" placeholder="Disabled..." disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="error-input">Error State</Label>
                <Input id="error-input" placeholder="Error..." aria-invalid="true" />
              </div>
            </CardContent>
          </Card>

          {/* Textarea */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Textarea</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-textarea">Default Textarea</Label>
                <Textarea id="default-textarea" placeholder="Enter longer text..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disabled-textarea">Disabled Textarea</Label>
                <Textarea id="disabled-textarea" placeholder="Disabled..." disabled rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Switch */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Switch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="switch-1">Enable notifications</Label>
                <Switch
                  id="switch-1"
                  checked={switchValue}
                  onCheckedChange={setSwitchValue}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="switch-2" className="text-muted-foreground">Disabled switch</Label>
                <Switch id="switch-2" disabled />
              </div>
            </CardContent>
          </Card>

          {/* Labels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Labels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Label</Label>
                <p className="text-xs text-muted-foreground">Used for form field labels</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Muted Label</Label>
                <p className="text-xs text-muted-foreground">For secondary labels</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Badges Section */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">Badges</h2>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Cards Section */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">Cards</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is the card content area where you can place any content.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Hoverable Card</CardTitle>
              <CardDescription>Hover to see effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This card has hover states for interactive elements.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Highlighted Card</CardTitle>
              <CardDescription>With primary border</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This card has a highlighted border to draw attention.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Spacing Reference */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">Spacing</h2>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((space) => (
                <div key={space} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-12 shrink-0">
                    {space * 4}px
                  </span>
                  <span className="text-xs text-muted-foreground w-8 shrink-0">
                    {space}
                  </span>
                  <div
                    className="h-4 bg-primary/20 rounded"
                    style={{ width: `${space * 16}px` }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Border Radius */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">Border Radius</h2>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6">
              {[
                { name: 'rounded-sm', class: 'rounded-sm' },
                { name: 'rounded-md', class: 'rounded-md' },
                { name: 'rounded-lg', class: 'rounded-lg' },
                { name: 'rounded-xl', class: 'rounded-xl' },
                { name: 'rounded-2xl', class: 'rounded-2xl' },
                { name: 'rounded-full', class: 'rounded-full' },
              ].map((radius) => (
                <div key={radius.name} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'w-16 h-16 bg-primary/20 border border-border',
                      radius.class
                    )}
                  />
                  <span className="text-xs text-muted-foreground">{radius.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Shadows */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">Shadows</h2>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-8">
              {[
                { name: 'shadow-xs', class: 'shadow-xs' },
                { name: 'shadow-sm', class: 'shadow-sm' },
                { name: 'shadow', class: 'shadow' },
                { name: 'shadow-md', class: 'shadow-md' },
                { name: 'shadow-lg', class: 'shadow-lg' },
              ].map((shadow) => (
                <div key={shadow.name} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'w-20 h-20 bg-card rounded-lg border border-border',
                      shadow.class
                    )}
                  />
                  <span className="text-xs text-muted-foreground">{shadow.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
