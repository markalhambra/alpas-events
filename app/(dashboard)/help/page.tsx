import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BookOpen, Mail, QrCode, Users, BarChart3, ClipboardList, Settings, Upload, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Welcome to Event Management Tracker</h4>
            <p className="text-sm text-muted-foreground mb-3">
              This application helps you manage event registrations, track RSVPs, manage guest attendance, and analyze event data.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Main Sections:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li><strong>Dashboard:</strong> Overview of your events and recent activity</li>
              <li><strong>Events:</strong> Create, view, and manage all your events</li>
              <li><strong>Admin Users:</strong> Manage team members and their access levels (Super Admin only)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "events",
      title: "Managing Events",
      icon: AlertCircle,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Creating an Event</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Click "New Event" on the Events page to get started. Fill in event details including:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Event name and description</li>
              <li>• Date and time (start, end, and RSVP deadline)</li>
              <li>• Venue location</li>
              <li>• RSVP form options (plus-one, dietary preferences)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Event Settings</h4>
            <p className="text-sm text-muted-foreground">
              Access Settings in any event to configure RSVP form options or delete the event entirely.
              Use Clone event on the overview to copy the venue, RSVP options, and email templates into a new date. Guests and seating are not copied.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "guests",
      title: "Guest Management",
      icon: Users,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Adding Guests</h4>
            <p className="text-sm text-muted-foreground mb-3">
              In any event, go to the Guests section to add individual guests or import multiple guests at once.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Guest Information</h4>
            <p className="text-sm text-muted-foreground space-y-1">
              Each guest can have the following details:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 mt-2">
              <li>• Full name and email address</li>
              <li>• Mobile number and salutation (Mr., Ms., Dr., etc.)</li>
              <li>• Company / Publication</li>
              <li>• Guest category (VIP, Media, Sponsor, Speaker, General)</li>
              <li>• RSVP and attendance status</li>
              <li>• Dietary preferences and plus-one name (if enabled)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Saved contacts</h4>
            <p className="text-sm text-muted-foreground">
              Contacts is a shared address book. Search it from an event&apos;s Guests page with Add from contacts. If that email is already a guest, only the name, company, and mobile are updated. Use Save to contacts on a guest to store them for the next event. Deleting a contact does not remove them from events.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Bulk Import</h4>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to import multiple guests at once. This is faster for large events.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "invitations",
      title: "Sending Invitations",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Invitation Methods</h4>
            <p className="text-sm text-muted-foreground mb-3">
              You can invite guests via email, Viber, QR code, or both:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li><strong>Email:</strong> Guests receive an email with an RSVP link</li>
              <li><strong>Viber:</strong> On a guest row, choose Send Viber invite. Viber opens on this phone or laptop with that guest&apos;s number and the invitation ready to send. The guest needs a mobile number, and Viber must be installed.</li>
              <li><strong>QR Code:</strong> Generate and share QR codes for quick access to RSVP form</li>
              <li><strong>Both:</strong> Send both email and provide QR code option</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Invitation Status</h4>
            <p className="text-sm text-muted-foreground">
              Track the status of each invitation: Sent, Accepted, Declined, Pending, or Expired (past RSVP deadline).
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Resending Invitations</h4>
            <p className="text-sm text-muted-foreground">
              You can resend invitations to guests who haven't responded or want a reminder.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "rsvp",
      title: "RSVP Management",
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Tracking RSVPs</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Monitor guest responses in real-time. The Invitations section shows acceptance rates and pending responses.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">RSVP Statuses</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li><strong>Accepted:</strong> Guest confirmed attendance</li>
              <li><strong>Declined:</strong> Guest declined the invitation</li>
              <li><strong>Pending:</strong> Invitation sent but no response</li>
              <li><strong>Expired:</strong> Past RSVP deadline, no response</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Guest details on accept</h4>
            <p className="text-sm text-muted-foreground">
              When a guest accepts, they can confirm or correct their name, email, company or publication, and mobile number. Those updates are saved on their guest record.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Add to calendar</h4>
            <p className="text-sm text-muted-foreground">
              After accepting, guests can add the event to Google Calendar or Apple Calendar. The same links are included in the confirmation email.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Manual RSVP Override</h4>
            <p className="text-sm text-muted-foreground">
              Event Coordinators can manually update guest RSVP status if needed (for phone RSVPs, etc.).
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "attendance",
      title: "Attendance Tracking",
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Marking Attendance</h4>
            <p className="text-sm text-muted-foreground mb-3">
              On event day, use the Attendance section to mark guests as present.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Attendance Statuses</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li><strong>Confirmed Present:</strong> Guest attended as expected</li>
              <li><strong>No Show:</strong> Guest accepted but didn't attend</li>
              <li><strong>Walk-in Override:</strong> Guest attended despite declining</li>
              <li><strong>Unregistered Walk-in:</strong> Guest attended without prior RSVP</li>
              <li><strong>Excused Absence:</strong> Guest accepted but informed you of absence</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">QR Check-in</h4>
            <p className="text-sm text-muted-foreground">
              Use the Check-In page to scan guest QR codes and mark attendance quickly during the event.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "analytics",
      title: "Analytics & Reports",
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Event Analytics</h4>
            <p className="text-sm text-muted-foreground mb-3">
              View detailed analytics for each event including:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Total guests and RSVP acceptance rate</li>
              <li>• Actual attendance vs. expected attendance</li>
              <li>• Guest demographics and categories</li>
              <li>• Email engagement metrics</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Data Export</h4>
            <p className="text-sm text-muted-foreground">
              Export guest data, attendance records, and analytics to CSV for further analysis.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "seating",
      title: "Seating Arrangements",
      icon: ClipboardList,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Organizing Seating</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Use the Seating section to organize guests into tables and manage table assignments.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Table Management</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Create and name tables</li>
              <li>• Assign guests to specific tables</li>
              <li>• Manage table capacity</li>
              <li>• Print seating charts and place cards</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "templates",
      title: "Email Templates",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Customizing Email Templates</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Customize email templates for different communication types:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Invitation emails</li>
              <li>• Acceptance confirmations</li>
              <li>• Decline acknowledgments</li>
              <li>• RSVP reminders</li>
              <li>• Thank you emails</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Template Variables</h4>
            <p className="text-sm text-muted-foreground">
              Use variables like {`{guest_name}`}, {`{event_name}`}, {`{rsvp_link}`} to personalize templates automatically.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "qr",
      title: "QR Code Check-in",
      icon: QrCode,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Event Day Check-in</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Use the Check-In page on event day to quickly register guest arrivals using QR code scanning.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">How It Works</h4>
            <ol className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>1. Generate QR codes for your guests (available in Guests and Invitations sections)</li>
              <li>2. Send QR codes to guests via email or display on screens</li>
              <li>3. On event day, use the Check-In page to scan QR codes</li>
              <li>4. System automatically marks guests as present</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Plus One Check-in</h4>
            <p className="text-sm text-muted-foreground">
              If plus-ones are enabled, guests can register their companion during check-in.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "admin",
      title: "Admin User Management",
      icon: Settings,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">User Roles</h4>
            <p className="text-sm text-muted-foreground mb-3">
              There are different access levels available:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li><strong>Super Admin:</strong> Full access including user management</li>
              <li><strong>Event Coordinator:</strong> Create and manage events and guests</li>
              <li><strong>Staff:</strong> Check-in access only</li>
              <li><strong>Viewer:</strong> Read-only dashboard access</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Managing Team Members</h4>
            <p className="text-sm text-muted-foreground">
              Super Admins can add, edit, and remove team members from the Admin Users section.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "tips",
      title: "Tips & Best Practices",
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">General Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• <strong>Plan ahead:</strong> Set RSVP deadlines well in advance</li>
              <li>• <strong>Test emails:</strong> Send test invitations to yourself first</li>
              <li>• <strong>Use categories:</strong> Organize guests by type (VIP, Media, etc.) for better insights</li>
              <li>• <strong>Regular backups:</strong> Periodically export your guest data</li>
              <li>• <strong>Mobile friendly:</strong> RSVP forms are optimized for mobile devices</li>
              <li>• <strong>Track engagement:</strong> Use analytics to understand guest behavior</li>
              <li>• <strong>Batch operations:</strong> Use bulk import for large guest lists</li>
              <li>• <strong>Double-check before deleting:</strong> Deleted events cannot be recovered</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Help & Documentation</h1>
          <p className="text-muted-foreground mt-1">Complete guide to using the Event Management Tracker</p>
        </div>
        <Button asChild>
          <Link href="/dashboard">← Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="mt-1 p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {section.content}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50 border-0">
        <CardHeader>
          <CardTitle className="text-base">Need More Help?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If you encounter any issues or have questions not covered in this guide, please contact your system administrator or refer to the in-app help tooltips available throughout the application.
        </CardContent>
      </Card>
    </div>
  );
}
