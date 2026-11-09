import { Button } from "@/components/ui/button";

interface CalendarLinksProps {
  googleUrl: string;
  icsUrl: string;
}

export function CalendarLinks({ googleUrl, icsUrl }: CalendarLinksProps) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      <p className="text-sm text-muted-foreground">Add this event to your calendar</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button asChild variant="outline" className="flex-1">
          <a href={googleUrl} target="_blank" rel="noopener noreferrer">
            Google Calendar
          </a>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <a href={icsUrl}>Apple Calendar</a>
        </Button>
      </div>
    </div>
  );
}
