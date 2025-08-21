import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full bg-background/50 text-sm text-muted-foreground">
            <div className="w-full flex h-16 items-center justify-center">
                <p className='text-center'>
                    Developed by{' '}
                    <Link href="https://github.com/ACLay" className="underline">
                        Alex Lay
                    </Link>{' '}
                    and{' '}
                    <Link
                        href="https://github.com/loeclos"
                        className="underline"
                    >
                        gleb
                    </Link>
                </p>
            </div>
        </footer>
    );
}
